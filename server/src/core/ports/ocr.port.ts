export interface OcrResult {
  vendor: string;
  date: string;
  amount: number;
  currency: string;
  confidence: number;
}

export type OcrOutcome =
  | { ok: true; result: OcrResult }
  | { ok: false; reason: string };

export interface OcrServicePort {
  process(imageKey: string): Promise<OcrOutcome>;
  isLowConfidence(outcome: OcrOutcome): boolean;
}