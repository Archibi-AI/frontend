"use client";
import { ErrorState } from "@/shared/ui/error-state";
import type { AppError } from "./app-error";
import { AppMessages } from "./messages";

export function ErrorView({ error, onRetry }: { error: AppError; onRetry?: () => void }) {
  if (error.code === "UNAUTHORIZED") return null; // bffFetch already redirects to login
  const title = error.code === "NO_INTERNET" ? "You're offline" : "Something went wrong";
  const message = error.code === "NO_INTERNET" ? AppMessages.noInternet : error.message;
  return <ErrorState title={title} message={message} onRetry={onRetry} />;
}
