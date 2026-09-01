import type { Expense, ExpenseStatus, NewExpense } from "../entities/expense";

export type { Expense, ExpenseStatus, NewExpense };

export interface ListExpensesQuery {
  user_id: string;
  status?: ExpenseStatus;
  from?: string;
  to?: string;
  vendor?: string;
  page: number;
  page_size: number;
}

export interface ExpenseList {
  items: Expense[];
  total: number;
  page: number;
  page_size: number;
}

export interface ExpenseRepositoryPort {
  list(query: ListExpensesQuery): Promise<ExpenseList>;
  getById(id: string, user_id: string): Promise<Expense | null>;
  insert(data: NewExpense): Promise<Expense>;
  updateStatus(id: string, user_id: string, status: ExpenseStatus): Promise<Expense | null>;
  updateExtractedData(
    id: string,
    user_id: string,
    fields: {
      vendor: string | null;
      amount: number | null;
      currency: string | null;
      date: string | null;
      confidence: number | null;
      status: ExpenseStatus;
      ocr_error: string | null;
    },
  ): Promise<Expense | null>;
}