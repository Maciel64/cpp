import { describe, expect, test } from "bun:test";
import { MockOcrService } from "../src/adapters/ocr/mock.ocr.service";

function sequence(...values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("MockOcrService", () => {
  test("ok:true com confiança alta -> isLowConfidence false", async () => {
    const ocr = new MockOcrService(sequence(0.5, 0.5, 0, 0, 0, 0.5, 0.99, 0));
    const outcome = await ocr.process(new Uint8Array(0));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(outcome.result.amount).toBeGreaterThan(0);
      expect(ocr.isLowConfidence(outcome)).toBe(false);
    }
  });

  test("confiança baixa -> isLowConfidence true", async () => {
    const ocr = new MockOcrService(sequence(0.5, 0.5, 0, 0, 0, 0.5, 0.05, 0));
    const outcome = await ocr.process(new Uint8Array(0));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(ocr.isLowConfidence(outcome)).toBe(true);
    }
  });

  test("falha -> ok:false com reason", async () => {
    const ocr = new MockOcrService(sequence(0.5, 0.01));
    const outcome = await ocr.process(new Uint8Array(0));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason.length).toBeGreaterThan(0);
  });
});