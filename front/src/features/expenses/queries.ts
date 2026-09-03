"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ConfirmInput, ListExpensesQuery } from "@/types/expense";

export const expenseKeys = {
  all: ["expenses"] as const,
  list: (q: ListExpensesQuery) => [...expenseKeys.all, "list", q] as const,
  detail: (id: string) => [...expenseKeys.all, id] as const,
  receiptUrl: (id: string) => [...expenseKeys.all, id, "receipt-url"] as const,
};

export function useExpenses(query: ListExpensesQuery) {
  return useQuery({
    queryKey: expenseKeys.list(query),
    queryFn: () => api.listExpenses(query),
    placeholderData: (prev) => prev,
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => api.getExpense(id),
    enabled: !!id,
    placeholderData: (prev) => prev,
  });
}

export function useReceiptUrl(id: string | null) {
  return useQuery({
    queryKey: expenseKeys.receiptUrl(id ?? ""),
    queryFn: () => api.receiptUrl(id!),
    enabled: !!id,
  });
}

export function useSubmitReceipt(engine: "mock" | "google" = "mock") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      return api.submitReceipt(file, engine);
    },
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all });
      queryClient.setQueryData(expenseKeys.detail(expense.id), expense);
    },
  });
}

export function useConfirmExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfirmInput) => api.confirmExpense(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(expenseKeys.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: expenseKeys.list({}) });
    },
  });
}
