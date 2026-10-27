"use client";
import { Receipt } from "lucide-react";
import type { AppError } from "@/shared/errors/app-error";
import { ErrorView } from "@/shared/errors/error-view";
import { usePagedList } from "@/shared/http/paged-query";
import { cn } from "@/shared/lib/cn";
import { formatDate } from "@/shared/lib/format";
import { EmptyState } from "@/shared/ui/empty-state";
import { InfiniteSentinel } from "@/shared/ui/infinite-list";
import { Skeleton } from "@/shared/ui/skeleton";
import type { Transaction } from "../schemas";

const TONE: Record<string, string> = {
  completed: "border-success text-success",
  successful: "border-success text-success",
  pending: "border-warning text-warning",
  failed: "border-danger text-danger",
  unsuccessful: "border-danger text-danger",
  canceled: "border-line-strong text-subtle",
};

export function statusTone(status: string): string {
  return TONE[status.toLowerCase()] ?? "border-line-strong text-subtle";
}

/** Mirrors TransactionsScreen: 24 per page; shows the code + status, plus amount/date when the backend includes them. */
export function TransactionsList() {
  const list = usePagedList<{ transactions: Transaction[] }, Transaction>({ key: ["me", "transactions"], path: "/bff/account/transactions", pick: (r) => r.transactions });
  if (list.isPending) return <div className="space-y-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16" />)}</div>;
  if (list.isError) return <ErrorView error={list.error as AppError} onRetry={() => list.refetch()} />;
  if (list.items.length === 0) return <EmptyState icon={<Receipt className="size-10 text-subtle" aria-hidden />} title="No transactions yet" />;
  return (
    <>
      <ul className="divide-y divide-line overflow-hidden rounded-md border border-line bg-surface">
        {list.items.map((t) => {
          const amount = typeof t.amount === "string" || typeof t.amount === "number" ? String(t.amount) : null;
          const when = typeof t.created_at === "string" ? formatDate(t.created_at) : "";
          return (
            <li key={t.uuid} className="flex items-center gap-4 px-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm text-ink-3">{t.code}</p>
                {when && <p className="text-xs text-subtle">{when}</p>}
              </div>
              {amount && <span className="text-sm font-medium text-ink-2">{amount}{typeof t.currency === "string" ? ` ${t.currency.toUpperCase()}` : ""}</span>}
              <span className={cn("rounded-pill border px-3 py-0.5 text-xs font-medium capitalize", statusTone(t.status))}>{t.status}</span>
            </li>
          );
        })}
      </ul>
      <InfiniteSentinel hasMore={Boolean(list.hasNextPage)} loading={list.isFetchingNextPage} onLoadMore={() => list.fetchNextPage()} />
    </>
  );
}
