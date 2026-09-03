import { describe, expect, test } from "bun:test";
import type { Expense } from "../src/core/entities/expense";
import type { ExpenseRepositoryPort } from "../src/core/ports/expense-repository.port";
import type { OcrServicePort } from "../src/core/ports/ocr.port";
import type { StoragePort } from "../src/core/ports/storage.port";
import { StatusChangeUseCase } from "../src/use-cases/expenses/status-change.use-case";
import { SubmitReceiptToOcrUseCase } from "../src/use-cases/expenses/submit-receipt-to-ocr.use-case";

const baseExpense = (over: Partial<Expense> = {}): Expense => ({
  id: "e1",
  user_id: "u1",
  vendor: null,
  amount: null,
  currency: null,
  date: null,
  receipt_key: null,
  confidence: null,
  status: "pending_review",
  ocr_error: null,
  created_at: "",
  updated_at: "",
  ...over,
});

const stubRepo = (over: Partial<ExpenseRepositoryPort> = {}): ExpenseRepositoryPort => ({
  list: async () => ({ items: [], total: 0, page: 1, page_size: 10 }),
  getById: async (id) => (id === "e1" ? baseExpense() : null),
  insert: async (data) => baseExpense(data),
  updateStatus: async (id, _u, status) => (id === "e1" ? baseExpense({ status }) : null),
  updateExtractedData: async (id, _u, fields) =>
    id === "e1" ? baseExpense({ ...fields, vendor: fields.vendor ?? null }) : null,
  ...over,
});

describe("StatusChangeUseCase", () => {
  const repo = stubRepo();
  const uc = new StatusChangeUseCase(repo);

  test("pending_review -> confirmed", async () => {
    const expense = await uc.execute("e1", "u1", "confirmed");
    expect(expense.status).toBe("confirmed");
  });

  test("needs_attention -> confirmed", async () => {
    await expect(uc.execute("e1", "u1", "confirmed")).resolves.toMatchObject({ status: "confirmed" });
  });

  test("confirmed -> pending_review é inválido (409)", async () => {
    const locked = stubRepo({
      getById: async () => baseExpense({ status: "confirmed" }),
      updateStatus: async () => null,
    });
    const ucLocked = new StatusChangeUseCase(locked);
    await expect(ucLocked.execute("e1", "u1", "pending_review")).rejects.toMatchObject({
      status: 409,
      code: "invalid_status_transition",
    });
  });

  test("expense inexistente -> 404", async () => {
    await expect(uc.execute("nope", "u1", "confirmed")).rejects.toMatchObject({ status: 404 });
  });
});

describe("SubmitReceiptToOcrUseCase", () => {
  class StubOcr implements OcrServicePort {
    constructor(private readonly outcome: any) {}
    async process(): Promise<any> {
      return this.outcome;
    }
    isLowConfidence(outcome: any): boolean {
      return outcome.ok && outcome.result.confidence < 0.9;
    }
  }

  const storage: StoragePort = {
    upload: async (key, _body, _ct) => {
      capturedKey = key;
    },
    getSignedDownloadUrl: async () => "url",
  };
  let capturedKey = "";
  let inserted: any = null;
  const repo: ExpenseRepositoryPort = stubRepo({
    insert: async (data) => {
      inserted = data;
      return baseExpense(data);
    },
  });

  test("sucesso alto confiança -> pending_review, chave receipts/{user}/", async () => {
    const uc = new SubmitReceiptToOcrUseCase(
      storage,
      new StubOcr({ ok: true, result: { vendor: "Loja A", date: "2026-08-01", amount: 43.2, currency: "BRL", confidence: 0.97 } }),
      repo,
    );
    const expense = await uc.execute({ userId: "u1", filename: "cupom.pdf", contentType: "application/pdf", bytes: new Uint8Array(4) });
    expect(expense.status).toBe("pending_review");
    expect(expense.vendor).toBe("Loja A");
    expect(capturedKey).toMatch(/^receipts\/u1\/.+\.pdf$/);
    expect(inserted.receipt_key).toBe(capturedKey);
  });

  test("confiança baixa -> needs_attention", async () => {
    const uc = new SubmitReceiptToOcrUseCase(
      storage,
      new StubOcr({ ok: true, result: { vendor: "Loja B", date: "2026-08-01", amount: 9.9, currency: "BRL", confidence: 0.62 } }),
      repo,
    );
    const expense = await uc.execute({ userId: "u1", filename: "recibo.jpg", contentType: "image/jpeg", bytes: new Uint8Array(4) });
    expect(expense.status).toBe("needs_attention");
  });

  test("campos ausentes (date/vendor vazios) -> insert com null, não string vazia", async () => {
    const uc = new SubmitReceiptToOcrUseCase(
      storage,
      new StubOcr({ ok: true, result: { vendor: "", date: "", amount: 0, currency: "BRL", confidence: 0.95 } }),
      repo,
    );
    await uc.execute({ userId: "u1", filename: "recibo.jpg", contentType: "image/jpeg", bytes: new Uint8Array(4) });
    expect(inserted.date).toBeNull();
    expect(inserted.vendor).toBeNull();
    expect(inserted.amount).toBeNull();
  });

  test("falha do OCR -> needs_attention com ocr_error", async () => {
    const uc = new SubmitReceiptToOcrUseCase(
      storage,
      new StubOcr({ ok: false, reason: "OCR engine failed" }),
      repo,
    );
    const expense = await uc.execute({ userId: "u1", filename: "x.png", contentType: "image/png", bytes: new Uint8Array(4) });
    expect(expense.status).toBe("needs_attention");
    expect(expense.ocr_error).toBe("OCR engine failed");
  });
});