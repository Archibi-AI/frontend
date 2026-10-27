import { QueryClient } from "@tanstack/react-query";
import { AppError } from "@/shared/errors/app-error";

const RETRYABLE = new Set(["SERVER", "NO_INTERNET", "REQUEST_TIMEOUT"]);

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (!(error instanceof AppError)) return failureCount < 2;
  return RETRYABLE.has(error.code) && failureCount < 2;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false, retry: shouldRetry },
      mutations: { retry: false },
    },
  });
}
