"use client";

import { useParams } from "next/navigation";
import { RequireAuth } from "@/features/auth/require-auth";
import { ReviewForm } from "@/features/expenses/review-form";

export default function ExpenseDetailPage() {
  const params = useParams<{ id: string }>();
  return (
    <RequireAuth>
      <main className="flex-1 p-6">
        <ReviewForm id={params.id} />
      </main>
    </RequireAuth>
  );
}
