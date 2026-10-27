"use client";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { useCredits } from "./use-ai";

export const creditsText = (n: number) => `${n} ${n === 1 ? "render" : "renders"} left`;

export function CreditsPill() {
  const { data } = useCredits();
  return (
    <Link href={routes.billing.index()} className="inline-flex h-9 items-center gap-2 rounded-pill border border-line bg-surface px-4 text-sm font-medium text-ink-3 hover:border-brand hover:text-brand">
      <Sparkles className="size-4 text-brand" aria-hidden />
      <span aria-live="polite">{data ? creditsText(data.ai_credits) : "Loading…"}</span>
    </Link>
  );
}
