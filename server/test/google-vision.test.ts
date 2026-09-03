import { describe, expect, test } from "bun:test";
import { GoogleVisionOcrService, parseReceiptText } from "../src/adapters/ocr/google-vision.ocr.service";

describe("parseReceiptText", () => {
  test("extrai vendor, valor, data e moeda de recibo típico", () => {
    const text = [
      "PADARIA PÃO DOURADO",
      "Av. das Flores, 123 - São Paulo/SP",
      "CNPJ 12.345.678/0001-90",
      "--------------------------------",
      "2x PÃO FRANCÊS          3,00",
      "1x CAFÉ PREMIUM         8,50",
      "TOTAL                 R$ 11,50",
      "FORMA DE PAGAMENTO: DINHEIRO",
      "Data: 15/08/2026 14:23",
    ].join("\n");

    const r = parseReceiptText(text);
    expect(r.vendor).toBe("PADARIA PÃO DOURADO");
    expect(r.amount).toBe(11.5);
    expect(r.date).toBe("2026-08-15");
    expect(r.currency).toBe("BRL");
    expect(r.confidence).toBeGreaterThanOrEqual(0.9);
  });

  test("valor com separador de milhar (pt-BR) 1.234,56", () => {
    const r = parseReceiptText("TOTAL R$ 1.234,56\nMERCADO SÃO JORGE");
    expect(r.amount).toBe(1234.56);
  });

  test("valor com ponto decimal (en) 12.50", () => {
    const r = parseReceiptText("AMOUNT $12.50\nTotal $ 12.50");
    expect(r.amount).toBe(12.5);
    expect(r.currency).toBe("BRL"); // sem $ US, default BRL
  });

  test("moeda USD quando aparece $ US", () => {
    const r = parseReceiptText("SUBTOTAL $ 9.99 USD\nTOTAL $ 9.99");
    expect(r.currency).toBe("USD");
  });

  test("sem valor -> confiança baixa", () => {
    const r = parseReceiptText("SEM VALOR VISIVEL\nDATA 01/01/2026\nLOJA X");
    expect(r.amount).toBe(0);
    expect(r.confidence).toBeLessThan(0.9);
  });
});

describe("GoogleVisionOcrService", () => {
  test("sem API key -> falha com reason explicativa", async () => {
    const svc = new GoogleVisionOcrService("");
    const out = await svc.process(new Uint8Array(0));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toContain("GOOGLE_VISION_API_KEY");
  });

  test("resposta da API vira OcrResult estruturado", async () => {
    const fakeFetch = async () =>
      new Response(
        JSON.stringify({
          responses: [
            {
              fullTextAnnotation: {
                text: "RESTAURANTE SABOR CASEIRO\nTOTAL R$ 87,90\nData 02/09/2026",
              },
            },
          ],
        }),
        { status: 200 },
      ) as unknown as Response;

    const svc = new GoogleVisionOcrService("test-key", fakeFetch as typeof fetch);
    const out = await svc.process(new Uint8Array(8));
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.result.vendor).toBe("RESTAURANTE SABOR CASEIRO");
      expect(out.result.amount).toBe(87.9);
      expect(out.result.date).toBe("2026-09-02");
    }
  });

  test("erro HTTP da API -> ok:false com status", async () => {
    const fakeFetch = async () => new Response("denied", { status: 403 }) as unknown as Response;
    const svc = new GoogleVisionOcrService("test-key", fakeFetch as typeof fetch);
    const out = await svc.process(new Uint8Array(4));
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toContain("403");
  });
});
