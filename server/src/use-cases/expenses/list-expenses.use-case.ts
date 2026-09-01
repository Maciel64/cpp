import type { ExpenseRepositoryPort, ListExpensesQuery } from "../../core/ports/expense-repository.port";

export class ListExpensesUseCase {
  constructor(private readonly repo: ExpenseRepositoryPort) {}

  execute(query: ListExpensesQuery) {
    return this.repo.list(query);
  }
}