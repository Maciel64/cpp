import axios, { type AxiosError } from "axios";
import type {
  ConfirmInput,
  Expense,
  ExpenseList,
  ListExpensesQuery,
} from "@/types/expense";
import { env } from "./env";
import { supabase } from "./supabase";

export interface ApiErrorBody {
  error: string;
  code: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const http = axios.create({ baseURL: env.NEXT_PUBLIC_API_URL });

http.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session)
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  return config;
});

function unwrap(e: unknown): never {
  if (axios.isAxiosError(e)) {
    const err = e as AxiosError<ApiErrorBody>;
    const body = err.response?.data;
    throw new ApiError(
      body?.error ?? err.message,
      err.response?.status ?? 500,
      body?.code ?? "network_error",
    );
  }
  throw e instanceof Error ? e : new Error(String(e));
}

export const api = {
  async listExpenses(query: ListExpensesQuery): Promise<ExpenseList> {
    try {
      const { data } = await http.get<ExpenseList>("/expenses", {
        params: query,
      });
      return data;
    } catch (e) {
      return unwrap(e);
    }
  },

  async getExpense(id: string): Promise<Expense | null> {
    try {
      const { data } = await http.get<Expense>(`/expenses/${id}`);
      return data;
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody>;
      if (err.response?.status === 404) return null;
      return unwrap(e);
    }
  },

  async submitReceipt(file: File): Promise<Expense> {
    try {
      const body = new FormData();
      body.append("file", file);
      const { data } = await http.post<Expense>("/expenses", body);
      return data;
    } catch (e) {
      return unwrap(e);
    }
  },

  async confirmExpense(id: string, input: ConfirmInput): Promise<Expense> {
    try {
      const { data } = await http.post<Expense>(
        `/expenses/${id}/confirm`,
        input,
      );
      return data;
    } catch (e) {
      return unwrap(e);
    }
  },

  async receiptUrl(id: string): Promise<string | null> {
    try {
      const { data } = await http.get<{ url: string | null }>(
        `/expenses/${id}/receipt-url`,
      );
      return data.url;
    } catch (e) {
      return unwrap(e);
    }
  },
};
