"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import type { AppError } from "@/shared/errors/app-error";
import { ErrorView } from "@/shared/errors/error-view";
import { bffFetch } from "@/shared/http/bff-fetch";
import { fetchPage, nextPageParam } from "@/shared/lib/paging";
import { EmptyState } from "@/shared/ui/empty-state";
import { InfiniteSentinel } from "@/shared/ui/infinite-list";
import { Skeleton } from "@/shared/ui/skeleton";
import type { ProfessionalSimple } from "../schemas";
import { ProfessionalCard } from "./professional-card";

/**
 * Infinite list of professionals (20 per page). Page 1 is server-rendered (`initial`); the rest loads through
 * `path` (/bff/hiring/category|tag/professionals or /bff/hiring/wishlist). `query` carries category/tag + filters.
 */
export function ProfessionalList({
  keyParts,
  path,
  query,
  initial,
  empty,
}: {
  keyParts: readonly unknown[];
  path: `/bff/${string}`;
  query: Record<string, string | undefined>;
  initial: ProfessionalSimple[];
  empty: string;
}) {
  const q = useInfiniteQuery({
    queryKey: ["hiring", ...keyParts],
    initialPageParam: 1,
    initialData: { pages: [initial], pageParams: [1] },
    staleTime: 60_000,
    queryFn: ({ pageParam }) => fetchPage(async () => (await bffFetch<{ professionals: ProfessionalSimple[] }>(path, { query: { ...query, page: pageParam } })).professionals),
    getNextPageParam: (last, all) => nextPageParam(last, all),
  });
  const items = q.data.pages.flat();

  if (q.isError && items.length === 0) return <ErrorView error={q.error as AppError} onRetry={() => q.refetch()} />;
  if (items.length === 0 && !q.isFetching) return <EmptyState icon={<Users className="size-10 text-subtle" aria-hidden />} title={empty} />;
  return (
    <>
      <ul className="grid gap-3 lg:grid-cols-2">
        {items.map((p) => (
          <li key={p.uuid}>
            <ProfessionalCard pro={p} />
          </li>
        ))}
      </ul>
      {q.isFetchingNextPage && <Skeleton className="mt-3 h-28 w-full" />}
      <InfiniteSentinel hasMore={Boolean(q.hasNextPage)} loading={q.isFetchingNextPage} onLoadMore={() => q.fetchNextPage()} />
      {q.isError && <ErrorView error={q.error as AppError} onRetry={() => q.fetchNextPage()} />}
    </>
  );
}
