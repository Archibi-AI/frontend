import { AppError } from "@/shared/errors/app-error";

/** Mirrors the app's PagingSource: INVALID_PAGE / NOT_FOUND end the list (HttpClientExt.kt:139-158). */
export async function fetchPage<T>(load: () => Promise<T[]>): Promise<T[]> {
  try {
    return await load();
  } catch (e) {
    if (e instanceof AppError && (e.code === "INVALID_PAGE" || e.code === "NOT_FOUND")) return [];
    throw e;
  }
}

export const nextPageParam = <T,>(last: T[], all: T[][]): number | undefined => (last.length === 0 ? undefined : all.length + 1);
