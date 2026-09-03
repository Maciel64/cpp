import type { OcrOutcome, OcrResult, OcrServicePort } from "../../core/ports/ocr.port";

const LOW_CONFIDENCE_THRESHOLD = 0.9;
const VISION_URL = "https://vision.googleapis.com/v1/images:annotate";

function base64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

// Reconhece moeda pelo símbolo presente no texto.
function detectCurrency(text: string): string {
  if (/\$\s?US|USD/i.test(text)) return "USD";
  return "BRL"; // BRL é o padrão da aplicação
}

// Busca um valor monetário (ex.: R$ 123,45 / 123.45 / $ 12.00).
function extractAmount(text: string): number | null {
  const m = text.match(/(?:total|valor|amount|pagar|pago)\s*[:.-]?\s*(?:r\$\s*|\$\s*)([\d.,]+)/i)
    || text.match(/(?:\b|r\$\s*|\$\s*)(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/i);
  if (!m) return null;
  let raw = m[1] ?? m[0];
  raw = raw.replace("R$", "").replace("$", "").trim();
  // Última separação é decimal (pt-BR: vírgula, en: ponto); demais são milhar.
  const last = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  if (last > lastDot) {
    raw = raw.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > last) {
    // 1.234,56 -> vírgula decimal (pt-BR)
    if (/,\d{2}$/.test(raw)) raw = raw.replace(/\./g, "").replace(",", ".");
    else raw = raw.replace(/,/g, "");
  }
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}

// Busca data no formato DD/MM/YYYY (com ou sem zero), ou ISO.
function extractDate(text: string): string | null {
  const m = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const year = y.length === 2 ? `20${y}` : y;
  const normal = `${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const parsed = new Date(`${normal}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

// Linhas "utilitárias" que nunca deveriam virar o nome do fornecedor.
const NOISE = /^(total|subtotal|troco|item|qtd|valor|desconto|pagamento|cupom|n\.?\s?fiscal|cnpj|.*@.*|www\..*)$/i;

function extractVendor(lines: string[]): string | null {
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (NOISE.test(line)) continue;
    if (/^\d/.test(line)) continue;
    if (line.length > 3 && line.length <= 60) return line;
  }
  return null;
}

/**
 * Parseia o texto bruto extraído de um recibo e devolve os campos estruturados.
 * Função pura e testável, independente da chamada ao Google Vision.
 */
export function parseReceiptText(text: string): OcrResult {
  const normalized = text.replace(/\r/g, "");
  const lines = normalized.split("\n");
  const full = normalized.toUpperCase();

  const amount = extractAmount(full);
  const date = extractDate(full);
  const currency = detectCurrency(full);
  const vendor = extractVendor(lines);

  const found = [amount !== null, date !== null, !!vendor].filter(Boolean).length;
  // Campo-chave (valor) pesa mais; sem ele a confiança cai.
  const confidence = amount !== null ? 0.75 + found * 0.08 : 0.4 + found * 0.1;

  return {
    vendor: vendor ?? "",
    date: date ?? "",
    amount: amount ?? 0,
    currency,
    confidence: Math.min(1, Math.round(confidence * 100) / 100),
  };
}

/**
 * Adapter para o Google Vision (Document Text Detection).
 * Requer GOOGLE_VISION_API_KEY no ambiente. Sem chave configura reflete
 * uma falha (retry do use-case trata), mantendo o pipeline resiliente.
 */
export class GoogleVisionOcrService implements OcrServicePort {
  constructor(
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async process(image: Uint8Array): Promise<OcrOutcome> {
    if (!this.apiKey) {
      return { ok: false, reason: "GOOGLE_VISION_API_KEY não configurada" };
    }

    const res = await this.fetchImpl(VISION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64(image) },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          },
        ],
      }),
    });

    if (!res.ok) {
      return { ok: false, reason: `Google Vision error ${res.status}: ${await res.text()}` };
    }

    const data = (await res.json()) as {
      responses?: Array<{ fullTextAnnotation?: { text?: string } }>;
    };
    const text = data.responses?.[0]?.fullTextAnnotation?.text;
    if (!text || !text.trim()) {
      return { ok: false, reason: "nenhum texto detectado na imagem" };
    }

    const result = parseReceiptText(text);
    if (!result.vendor && result.amount <= 0) {
      return { ok: false, reason: "não foi possível extrair campos do recibo" };
    }

    return { ok: true, result };
  }

  isLowConfidence(outcome: OcrOutcome): boolean {
    return outcome.ok && outcome.result.confidence < LOW_CONFIDENCE_THRESHOLD;
  }
}
