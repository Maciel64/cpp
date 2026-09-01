export const expenseStatuses = [
  "pending_review",
  "needs_attention",
  "confirmed",
] as const;

export type ExpenseStatus = (typeof expenseStatuses)[number];

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

export interface NewExpense {
  user_id: string;
  vendor: string | null;
  amount: number | null;
  currency: string | null;
  date: string | null;
  receipt_key: string | null;
  confidence: number | null;
  status: ExpenseStatus;
  ocr_error: string | null;
}