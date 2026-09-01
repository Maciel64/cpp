export type ExpenseStatus = "pending_review" | "needs_attention" | "confirmed";

export interface Expense {
  id: string;
  user_id: string;
  vendor: string | null;
  amount: number | null;
  currency: string | null;
  date: string | null;
  receipt_key: string | null;
  confidence: number | null;
  status: ExpenseStatus;
  ocr_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseList {
  items: Expense[];
  total: number;
  page: number;
  page_size: number;
}

export interface ListExpensesQuery {
  status?: ExpenseStatus;
  from?: string;
  to?: string;
  vendor?: string;
  page?: number;
  page_size?: number;
}

export interface ConfirmInput {
  vendor?: string;
  amount?: number;
  currency?: string;
  date?: string;
}
