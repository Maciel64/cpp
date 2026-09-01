"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useCallback } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ExpenseStatus } from "@/types/expense";
import { useExpenses } from "./queries";
import { StatusBadge } from "./status-badge";

const STATUS_OPTIONS: Array<
  { value: ""; label: string } | { value: ExpenseStatus; label: string }
> = [
  { value: "", label: "Todos" },
  { value: "pending_review", label: "Aguardando revisão" },
  { value: "needs_attention", label: "Requer atenção" },
  { value: "confirmed", label: "Confirmados" },
];

function money(amount: number | null, currency: string | null) {
  if (amount === null) return "—";
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency ?? "BRL",
    }).format(amount);
  } catch {
    return `${amount} ${currency ?? ""}`.trim();
  }
}

function date(d: string | null) {
  if (!d) return "—";
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("pt-BR");
}

// ponytail: URL state via nuqs; status/vendor/page compartilháveis, from/to ficam de fora (sem necessidade no demo)
export function ExpenseList() {
  const [params, setParams] = useQueryStates({
    status: parseAsString.withDefault(""),
    page: parseAsInteger.withDefault(1),
    vendor: parseAsString.withDefault(""),
  });

  const status = params.status as "" | ExpenseStatus;
  const { data, isLoading, isError, error } = useExpenses({
    status: status === "" ? undefined : status,
    vendor: params.vendor || undefined,
    page: params.page,
    page_size: 10,
  });

  const totalPages = Math.max(
    1,
    Math.ceil((data?.total ?? 0) / (data?.page_size ?? 10)),
  );

  const update = useCallback(
    (patch: Partial<{ status: string; vendor: string; page: number }>) => {
      setParams((prev) => ({ ...prev, ...patch }));
    },
    [setParams],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status}
          onValueChange={(value) => {
            update({ status: value as string, page: 1 });
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Status">
              {(value) => {
                const s = typeof value === "string" ? value : "";
                return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.label} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={params.vendor}
          onChange={(e) => update({ vendor: e.target.value, page: 1 })}
          placeholder="Filtrar por fornecedor…"
          className="max-w-56"
        />
      </div>

      {isLoading && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton estático, ordem não muda
                <TableRow key={i}>
                  <TableCell>
                    <span className="block h-3.5 w-28 animate-pulse rounded-none bg-muted" />
                  </TableCell>
                  <TableCell>
                    <span className="block h-3.5 w-16 animate-pulse rounded-none bg-muted" />
                  </TableCell>
                  <TableCell>
                    <span className="block h-3.5 w-20 animate-pulse rounded-none bg-muted" />
                  </TableCell>
                  <TableCell>
                    <span className="block h-3.5 w-12 animate-pulse rounded-none bg-muted" />
                  </TableCell>
                  <TableCell>
                    <span className="block h-5 w-24 animate-pulse rounded-none bg-muted" />
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="ml-auto block h-3.5 w-14 animate-pulse rounded-none bg-muted" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {isError && <p className="text-sm text-destructive">{error?.message}</p>}

      {data && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Confiança</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-36 text-center text-muted-foreground"
                  >
                    <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
                      <span className="text-3xl">📄</span>
                      <p className="text-sm font-medium text-foreground">
                        Nenhum recibo encontrado
                      </p>
                      <p className="text-xs">
                        Suba um recibo acima ou ajuste os filtros para ver
                        resultados.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {data.items.map((e, i) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: Math.min(i * 0.04, 0.4),
                    duration: 0.25,
                    ease: "easeOut",
                  }}
                  className="border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <TableCell>{e.vendor ?? "—"}</TableCell>
                  <TableCell>{money(e.amount, e.currency)}</TableCell>
                  <TableCell>{date(e.date)}</TableCell>
                  <TableCell>
                    {e.confidence === null
                      ? "—"
                      : `${Math.round(e.confidence * 100)}%`}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/expenses/${e.id}`}
                      className={buttonVariants({
                        variant: "link",
                        size: "sm",
                      })}
                    >
                      Revisar
                    </Link>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && data.total > data.page_size && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {params.page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={params.page <= 1}
              onClick={() => update({ page: params.page - 1 })}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={params.page >= totalPages}
              onClick={() => update({ page: params.page + 1 })}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
