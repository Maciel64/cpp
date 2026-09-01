"use client";

import { LogOut } from "lucide-react";
import { motion } from "motion/react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-provider";
import { RequireAuth } from "@/features/auth/require-auth";
import { ExpenseList } from "@/features/expenses/expense-list";
import { UploadForm } from "@/features/expenses/upload-form";

function ExpensesContent() {
  const { user, signOut } = useAuth();
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Despesas</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">
            Revise, confirme e acompanhe seus recibos.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm sm:justify-start">
          <span className="min-w-0 truncate text-muted-foreground">
            {user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={() => void signOut()}>
            <LogOut className="mr-2 size-4" />
            Sair
          </Button>
        </div>
      </motion.div>
      <UploadForm />
      <ExpenseList />
    </main>
  );
}

export default function ExpensesPage() {
  return (
    <RequireAuth>
      {/* nuqs usa useSearchParams — exige Suspense no App Router */}
      <Suspense
        fallback={<p className="p-6 text-sm text-black/60">Carregando…</p>}
      >
        <ExpensesContent />
      </Suspense>
    </RequireAuth>
  );
}
