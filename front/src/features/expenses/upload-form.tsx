"use client";

import { ImageUp, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { type DragEvent, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSubmitReceipt } from "./queries";

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const router = useRouter();
  const submit = useSubmitReceipt();

  async function onSubmit(file: File) {
    setError(null);
    try {
      const expense = await submit.mutateAsync(file);
      router.push(`/expenses/${expense.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no upload.");
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void onSubmit(file);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Novo recibo</CardTitle>
          <CardDescription>
            Envie uma imagem ou PDF — o OCR extrai automaticamente e cria uma
            despesa em &ldquo;aguardando revisão&rdquo;.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            disabled={submit.isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onSubmit(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            aria-label="Enviar recibo"
            disabled={submit.isPending}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-none border-2 border-dashed p-10 text-center transition-colors",
              dragging
                ? "border-emerald-500 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
                : "border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/40",
            )}
          >
            {submit.isPending ? (
              <>
                <Upload className="size-7 animate-pulse" />
                <span className="text-[15px]">Enviando recibo…</span>
              </>
            ) : (
              <>
                <ImageUp className="size-7" />
                <span className="text-base font-medium">
                  Arraste um recibo aqui ou clique para escolher
                </span>
                <span className="text-sm text-muted-foreground">
                  Imagem ou PDF
                </span>
              </>
            )}
          </button>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={submit.isPending}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="mr-2 size-4" />
            Selecionar arquivo
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
