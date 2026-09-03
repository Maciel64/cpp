import { randomUUID } from "node:crypto";
import type { Expense } from "../../core/entities/expense";
import type { ExpenseRepositoryPort } from "../../core/ports/expense-repository.port";
import type { OcrOutcome, OcrServicePort } from "../../core/ports/ocr.port";
import type { StoragePort } from "../../core/ports/storage.port";

export interface SubmitReceiptInput {
  userId: string;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}

const DEFAULT_MAX_ATTEMPTS = 3;

export class SubmitReceiptToOcrUseCase {
  constructor(
    private readonly storage: StoragePort,
    private readonly ocr: OcrServicePort,
    private readonly repo: ExpenseRepositoryPort,
    private readonly maxAttempts: number = DEFAULT_MAX_ATTEMPTS,
  ) {}

  async execute(input: SubmitReceiptInput): Promise<Expense> {
    const ext = input.filename.includes(".") ? input.filename.split(".").pop() : "bin";
    const key = `receipts/${input.userId}/${randomUUID()}.${ext}`;

    await this.storage.upload(key, input.bytes, input.contentType);
    const outcome = await this.processWithRetry(input.bytes);

    if (!outcome.ok) {
      return this.repo.insert({
        user_id: input.userId,
        vendor: null,
        amount: null,
        currency: null,
        date: null,
        receipt_key: key,
        confidence: null,
        status: "needs_attention",
        ocr_error: outcome.reason,
      });
    }

    const { result } = outcome;
    const status = this.ocr.isLowConfidence(outcome) ? "needs_attention" : "pending_review";

    return this.repo.insert({
      user_id: input.userId,
      vendor: result.vendor || null,
      amount: result.amount > 0 ? result.amount : null,
      currency: result.currency || null,
      date: result.date || null,
      receipt_key: key,
      confidence: result.confidence,
      status,
      ocr_error: null,
    });
  }

  private async processWithRetry(image: Uint8Array): Promise<OcrOutcome> {
    let lastFailure: string | undefined;
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      const outcome = await this.ocr.process(image);
      if (outcome.ok) return outcome;
      lastFailure = outcome.reason;
      if (attempt < this.maxAttempts) {
        console.log(`[ocr] attempt ${attempt} failed (${outcome.reason}), retrying…`);
      }
    }
    return { ok: false, reason: lastFailure ?? "OCR engine failed to read the image" };
  }
}