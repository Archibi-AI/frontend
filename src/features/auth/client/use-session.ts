"use client";
import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/shared/http/bff-fetch";

export interface SessionUserView { uuid: string; username: string; email: string; imageUri: string }
type SessionResponse = { authenticated: false } | { authenticated: true; user: SessionUserView };

export function useSession(): { status: "loading" | "authenticated" | "anonymous"; user: SessionUserView | null } {
  const q = useQuery({ queryKey: ["session"], queryFn: () => bffFetch<SessionResponse>("/bff/session"), staleTime: 60_000 });
  if (q.isPending) return { status: "loading", user: null };
  if (q.data?.authenticated) return { status: "authenticated", user: q.data.user };
  return { status: "anonymous", user: null };
}
