import type { Expense, ExpenseStatus } from "../../core/entities/expense";
import type { ExpenseRepositoryPort } from "../../core/ports/expense-repository.port";
import {
  ExpenseNotFoundError,
  InvalidStatusTransitionError,
} from "../../core/errors/domain-errors";

const ALLOWED_TRANSITIONS: Record<ExpenseStatus, ExpenseStatus[]> = {
  pending_review: ["confirmed"],
  needs_attention: ["confirmed"],
  confirmed: [],
};

export class StatusChangeUseCase {
  constructor(private readonly repo: ExpenseRepositoryPort) {}

  async execute(id: string, userId: string, to: ExpenseStatus): Promise<Expense> {
    const expense = await this.repo.getById(id, userId);
    if (!expense) throw new ExpenseNotFoundError();

    if (!ALLOWED_TRANSITIONS[expense.status]?.includes(to)) {
      throw new InvalidStatusTransitionError(expense.status, to);
    }

    const updated = await this.repo.updateStatus(id, userId, to);
    if (!updated) throw new ExpenseNotFoundError();

    // ponytail: notify seam — future email/push hooks here, driven by expense+status
    this.notify(updated, updated.status);
    return updated;
  }

  private notify(expense: Expense, newStatus: ExpenseStatus): void {
    // eslint-disable-next-line no-console
    console.log(`[notify] expense ${expense.id} moved to ${newStatus}`);
  }
}