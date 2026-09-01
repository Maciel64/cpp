import type { Expense } from "../../core/entities/expense";
import type { ExpenseRepositoryPort } from "../../core/ports/expense-repository.port";
import {
  ExpenseNotFoundError,
  InvalidStatusTransitionError,
} from "../../core/errors/domain-errors";

export interface ConfirmInput {
  vendor?: string;
  amount?: number;
  currency?: string;
  date?: string;
}

const CONFIRMABLE: readonly string[] = ["pending_review", "needs_attention"];

export class ConfirmExpenseUseCase {
  constructor(private readonly expenseRepository: ExpenseRepositoryPort) {}

  async execute(id: string, userId: string, corrections: ConfirmInput): Promise<Expense> {
    const expense = await this.expenseRepository.getById(id, userId);
    
    if (!expense) throw new ExpenseNotFoundError();
    
    if (!CONFIRMABLE.includes(expense.status)) {
      throw new InvalidStatusTransitionError(expense.status, "confirmed");
    }

    if (Object.keys(corrections).length > 0) {
      const updated = await this.expenseRepository.updateExtractedData(id, userId, {
        vendor: corrections.vendor ?? expense.vendor,
        amount: corrections.amount ?? expense.amount,
        currency: corrections.currency ?? expense.currency,
        date: corrections.date ?? expense.date,
        confidence: expense.confidence,
        status: expense.status,
        ocr_error: expense.ocr_error,
      });

      if (!updated) throw new ExpenseNotFoundError();
    }

    const confirmed = await this.expenseRepository.updateStatus(id, userId, "confirmed");

    if (!confirmed) throw new ExpenseNotFoundError();
    
    return confirmed;
  }
}
