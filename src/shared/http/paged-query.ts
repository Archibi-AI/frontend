"use client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchPage, nextPageParam } from "@/shared/lib/paging";
import { bffFetch } from "./bff-fetch";

/** Infinite list over a `/bff/*?page=` endpoint with the app's paging rules (INVALID_PAGE / empty page ends the list). */
export function usePagedList<R, T>({ key, path, pick }: { key: readonly unknown[]; path: `/bff/${string}`; pick: (response: R) => T[] }) {
  const query = useInfiniteQuery({
    queryKey: key,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPage(async () => pick(await bffFetch<R>(path, { query: { page: pageParam } }))),
    getNextPageParam: (last, all) => nextPageParam(last, all),
  });
  return { ...query, items: query.data?.pages.flat() ?? [] };
}
