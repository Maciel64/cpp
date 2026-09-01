"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-provider";

function LoadingScreen({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <Loader2 className="size-8 animate-spin text-primary" />
      <p className="text-[15px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) return <LoadingScreen />;
  if (!user) return <LoadingScreen label="Redirecionando para o login…" />;
  return <>{children}</>;
}
