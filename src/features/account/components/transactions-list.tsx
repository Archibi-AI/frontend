"use client";
import { AlertCircle, CheckCircle2, Clock, Copy, Info, Receipt } from "lucide-react";
import type { ComponentType } from "react";
import type { AppError } from "@/shared/errors/app-error";
import { ErrorView } from "@/shared/errors/error-view";
import { usePagedList } from "@/shared/http/paged-query";
import { cn } from "@/shared/lib/cn";
import { EmptyState } from "@/shared/ui/empty-state";
import { InfiniteSentinel } from "@/shared/ui/infinite-list";
import { Skeleton } from "@/shared/ui/skeleton";
import { useToast } from "@/shared/ui/toast";
import type { Transaction } from "../schemas";

/** TransactionCard.kt: completed ✓ green · canceled clock amber · failed ! red · anything else (pending…) info gray. */
const STATUS: Record<string, { Icon: ComponentType<{ className?: string }>; tone: string }> = {
  completed: { Icon: CheckCircle2, tone: "text-success" },
  canceled: { Icon: Clock, tone: "text-[#ffa000]" },
  failed: { Icon: AlertCircle, tone: "text-[#e53935]" },
};
const FALLBACK = { Icon: Info, tone: "text-subtle" };
export const statusIcon = (status: string) => STATUS[status.toLowerCase()] ?? FALLBACK;

const amount = (t: Transaction) => {
  const n = Number(t.price);
  return t.price == null || Number.isNaN(n) ? null : `${n.toFixed(2)} ${(t.currency ?? "CAD").toUpperCase()}`;
};
/** The app shows the date part of the ISO timestamp. */
export const dateOf = (t: Transaction) => (t.timestamp ? t.timestamp.split("T")[0] : "");

/** One purchase, laid out exactly like the app's card: price + status icon, credits, date, copyable payment id. */
export function TransactionCard({ transaction: t }: { transaction: Transaction }) {
  const toast = useToast();
  const { Icon, tone } = statusIcon(t.status);
  const price = amount(t);
  async function copy() {
    try {
      await navigator.clipboard.writeText(t.code);
      toast({ kind: "success", title: "Payment ID copied" });
    } catch {
      toast({ kind: "error", title: "Couldn't copy the Payment ID." });
    }
  }
  return (
    <article className="flex h-full flex-col gap-2 rounded-md border border-dashed border-ink bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-bold text-ink-2">{price ?? "—"}</p>
        <Icon className={cn("size-6 shrink-0", tone)} aria-label={t.status} />
      </div>
      {t.creditCount != null && <p className="text-sm text-ink-3">Credits: {t.creditCount}</p>}
      {dateOf(t) && <p className="text-xs text-muted">{dateOf(t)}</p>}
      <div className="mt-auto flex items-center gap-1 pt-1">
        <p className="min-w-0 flex-1 truncate text-xs text-muted">Payment ID: {t.code}</p>
        <button type="button" onClick={copy} aria-label="Copy Payment ID" className="shrink-0 rounded-sm p-1.5 text-subtle hover:text-brand">
          <Copy className="size-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}

/** Mirrors TransactionsScreen: 24 per page; two cards per row, three on large screens. */
export function TransactionsList() {
  const list = usePagedList<{ transactions: Transaction[] }, Transaction>({ key: ["me", "transactions"], path: "/bff/account/transactions", pick: (r) => r.transactions });
  if (list.isPending) return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-32" />)}</div>;
  if (list.isError) return <ErrorView error={list.error as AppError} onRetry={() => list.refetch()} />;
  if (list.items.length === 0) return <EmptyState icon={<Receipt className="size-10 text-subtle" aria-hidden />} title="No transactions yet" />;
  return (
    <>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.items.map((t) => (
          <li key={t.uuid}>
            <TransactionCard transaction={t} />
          </li>
        ))}
      </ul>
      <InfiniteSentinel hasMore={Boolean(list.hasNextPage)} loading={list.isFetchingNextPage} onLoadMore={() => list.fetchNextPage()} />
    </>
  );
}
