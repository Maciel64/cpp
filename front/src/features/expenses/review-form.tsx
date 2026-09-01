"use client";

import { ArrowLeft, Check } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ExpenseStatus } from "@/types/expense";
import { useConfirmExpense, useExpense, useReceiptUrl } from "./queries";
import { StatusBadge } from "./status-badge";

function fmtDate(input: string | null): string {
  if (!input) return "";
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? input : d.toISOString().slice(0, 10);
}

function isPdf(receiptKey: string | null): boolean {
  if (!receiptKey) return false;
  return receiptKey.toLowerCase().endsWith(".pdf");
}

function LowConfidenceBanner({
  status,
  confidence,
}: {
  status: ExpenseStatus;
  confidence: number | null;
}) {
  if (status !== "pending_review" || confidence === null || confidence >= 0.6)
    return null;
  return (
    <Alert>
      <AlertTitle>Confiança baixa</AlertTitle>
      <AlertDescription>
        OCR com {Math.round(confidence * 100)}% de certeza — confira os dados
        antes de confirmar.
      </AlertDescription>
    </Alert>
  );
}

export function ReviewForm({ id }: { id: string }) {
  const { data: expense, isLoading, isError } = useExpense(id);
  const { data: signedUrl } = useReceiptUrl(expense?.receipt_key ? id : null);
  const confirm = useConfirmExpense(id);

  const [vendor, setVendor] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expense && !synced) {
      setVendor(expense.vendor ?? "");
      setAmount(expense.amount === null ? "" : String(expense.amount));
      setCurrency(expense.currency ?? "BRL");
      setDate(fmtDate(expense.date));
      setSynced(true);
    }
  }, [expense, synced]);

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  if (isError || !expense)
    return <p className="text-sm text-destructive">Despesa não encontrada.</p>;

  async function onSubmit() {
    setError(null);
    try {
      await confirm.mutateAsync({
        vendor: vendor || undefined,
        amount: amount ? Number(amount) : undefined,
        currency: currency || undefined,
        date: date || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao confirmar.");
    }
  }

  const confirmed = expense.status === "confirmed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/expenses"
          aria-label="Voltar para a lista"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">
          {expense.vendor ?? "Despesa"}
        </h1>
        <StatusBadge status={expense.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revisão do recibo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {expense.ocr_error && (
              <Alert variant="destructive">
                <AlertTitle>Falha no OCR</AlertTitle>
                <AlertDescription>{expense.ocr_error}</AlertDescription>
              </Alert>
            )}
            <LowConfidenceBanner
              status={expense.status}
              confidence={expense.confidence}
            />

            <div className="space-y-1.5">
              <Label htmlFor="vendor">Fornecedor</Label>
              <Input
                id="vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                disabled={confirmed}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={confirmed}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Moeda</Label>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  disabled={confirmed}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={confirmed}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {confirmed ? (
              <Alert className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400">
                <AlertDescription>
                  Despesa confirmada em{" "}
                  {new Date(expense.updated_at).toLocaleString("pt-BR")}.
                </AlertDescription>
              </Alert>
            ) : (
              <Button
                type="button"
                onClick={onSubmit}
                disabled={confirm.isPending}
              >
                <Check className="mr-2 size-4" />
                {confirm.isPending ? "Confirmando…" : "Confirmar despesa"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recibo</CardTitle>
          </CardHeader>
          <CardContent>
            {signedUrl ? (
              isPdf(expense.receipt_key) ? (
                <iframe
                  src={signedUrl}
                  title={`Recibo de ${expense.vendor ?? "despesa"}`}
                  className="h-[70vh] w-full rounded-md border"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <Image
                  src={signedUrl}
                  alt={`Recibo de ${expense.vendor ?? "despesa"}`}
                  className="w-full rounded-md border"
                  width={800}
                  height={600}
                  priority
                />
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Recibo não disponível.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
