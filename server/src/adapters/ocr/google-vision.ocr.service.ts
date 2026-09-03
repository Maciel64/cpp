import type { OcrOutcome, OcrResult, OcrServicePort } from "../../core/ports/ocr.port";

const LOW_CONFIDENCE_THRESHOLD = 0.9;
const VISION_URL = "https://vision.googleapis.com/v1/images:annotate";

function base64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function detectCurrency(text: string): string {
  if (/\$\s?US|USD/i.test(text)) return "USD";
  return "BRL";
}

function extractAmount(text: string): number | null {
  const byKeyword =
    text.match(/(?:total|valor|amount|pagar|pago)\s*[:.-]?\s*(?:r\$\s*|\$\s*)?([\d][\d.,]*)/i)?.[1] ??
    null;
  const fallback =
    text.match(/(?:r\$\s*|\$\s*)([\d][\d.,]*)/i)?.[1] ??
    text.match(/\b\$\s*([\d][\d.,]*)/i)?.[1] ??
    text.match(/([\d][\d.,]*[.,]\d{2})\b/)?.[1] ??
    null;

  const raw = byKeyword ?? fallback;
  if (raw == null) return null;
  return parseMoney(raw);
}

function parseMoney(raw: string): number | null {
  let s = raw.trim().replace("R$", "").replace("$", "").trim();
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) {
    if (/,\d{2}$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/\.|,/g, "");
  } else if (lastDot > lastComma) {
    if (/\.\d{2}$/.test(s)) s = s.replace(/,/g, "");
    else s = s.replace(/,|\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

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

export function parseReceiptText(text: string): OcrResult {
  const normalized = text.replace(/\r/g, "");
  const lines = normalized.split("\n");
  const full = normalized.toUpperCase();

  const amount = extractAmount(full);
  const date = extractDate(full);
  const currency = detectCurrency(full);
  const vendor = extractVendor(lines);

  const found = [amount !== null, date !== null, !!vendor].filter(Boolean).length;
  const confidence = amount !== null ? 0.75 + found * 0.08 : 0.4 + found * 0.1;

  return {
    vendor: vendor ?? "",
    date: date ?? "",
    amount: amount ?? 0,
    currency,
    confidence: Math.min(1, Math.round(confidence * 100) / 100),
  };
}

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
