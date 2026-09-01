import { Badge } from "@/components/ui/badge";
import type { ExpenseStatus } from "@/types/expense";

const LABEL: Record<ExpenseStatus, string> = {
  pending_review: "Aguardando revisão",
  needs_attention: "Requer atenção",
  confirmed: "Confirmado",
};

const VARIANT: Record<
  ExpenseStatus,
  "outline" | "destructive" | "secondary" | "success" | "warning"
> = {
  pending_review: "warning",
  needs_attention: "destructive",
  confirmed: "success",
};

export function StatusBadge({ status }: { status: ExpenseStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
