import type {
  Expense,
  ExpenseList,
  ExpenseRepositoryPort,
  ListExpensesQuery,
  NewExpense,
} from "../../core/ports/expense-repository.port";
import { DatabaseError } from "../../core/errors/domain-errors";
import { adminClient } from "./client";

interface ExpenseRow {
  id: string;
  user_id: string;
  vendor: string | null;
  amount: number | null;
  currency: string | null;
  date: string | null;
  receipt_key: string | null;
  confidence: number | null;
  status: Expense["status"];
  ocr_error: string | null;
  created_at: string;
  updated_at: string;
}

function isExpenseRows(r: unknown): r is ExpenseRow[] {
  return (
    Array.isArray(r) &&
    r.every((x) => typeof x === "object" && x !== null && "id" in x && "user_id" in x)
  );
}

function toExpense(r: ExpenseRow): Expense {
  return { ...r };
}

export class SupabaseExpenseRepository implements ExpenseRepositoryPort {
  async list(query: ListExpensesQuery): Promise<ExpenseList> {
    let builder = adminClient
      .from("expenses")
      .select("*", { count: "exact" })
      .eq("user_id", query.user_id);

    if (query.status) builder = builder.eq("status", query.status);
    if (query.from) builder = builder.gte("date", query.from);
    if (query.to) builder = builder.lte("date", query.to);
    if (query.vendor) builder = builder.ilike("vendor", `%${query.vendor}%`);

    builder = builder.order("created_at", { ascending: false });

    const offset = (query.page - 1) * query.page_size;
    builder = builder.range(offset, offset + query.page_size - 1);

    const { data, error, count } = await builder;
    if (error) throw new DatabaseError(error.message);
    if (!isExpenseRows(data)) throw new DatabaseError("Unexpected row shape");
    return { items: data, total: count ?? data.length, page: query.page, page_size: query.page_size };
  }

  async getById(id: string, user_id: string): Promise<Expense | null> {
    const { data, error } = await adminClient
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user_id)
      .maybeSingle();
    if (error) throw new DatabaseError(error.message);
    return data ? toExpense(data) : null;
  }

  async insert(data: NewExpense): Promise<Expense> {
    const { data: row, error } = await adminClient.from("expenses").insert(data).select().single();
    if (error) throw new DatabaseError(error.message);
    return toExpense(row);
  }

  async updateStatus(id: string, user_id: string, status: Expense["status"]): Promise<Expense | null> {
    const { data, error } = await adminClient
      .from("expenses")
      .update({ status })
      .eq("id", id)
      .eq("user_id", user_id)
      .select()
      .maybeSingle();
    if (error) throw new DatabaseError(error.message);
    return data ? toExpense(data) : null;
  }

  async updateExtractedData(
    id: string,
    user_id: string,
    fields: {
      vendor: string | null;
      amount: number | null;
      currency: string | null;
      date: string | null;
      confidence: number | null;
      status: Expense["status"];
      ocr_error: string | null;
    },
  ): Promise<Expense | null> {
    const { data, error } = await adminClient
      .from("expenses")
      .update(fields)
      .eq("id", id)
      .eq("user_id", user_id)
      .select()
      .maybeSingle();
    if (error) throw new DatabaseError(error.message);
    return data ? toExpense(data) : null;
  }
}