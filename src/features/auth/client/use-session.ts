"use client";
import { useQuery } from "@tanstack/react-query";
import { bffFetch } from "@/shared/http/bff-fetch";

export interface SessionUserView { uuid: string; username: string; email: string; imageUri: string }
export type SessionResponse =
  | { authenticated: false; reason?: "account_removed" }
  | { authenticated: true; user: SessionUserView };

const BOOT_FLAG = "ab_boot";

/** The account validation (A8) runs once per browser session, like the app's initial loader. */
function needsBoot(): boolean {
  try {
    return window.sessionStorage.getItem(BOOT_FLAG) === null;
  } catch {
    return false;
  }
}

export async function fetchSession(): Promise<SessionResponse> {
  const boot = needsBoot();
  const res = await bffFetch<SessionResponse>("/bff/session", { query: { boot: boot ? 1 : undefined } });
  if (boot) {
    try {
      window.sessionStorage.setItem(BOOT_FLAG, "1");
    } catch {
      /* storage unavailable (private mode) — validate again next load, harmless */
    }
  }
  return res;
}

export function useSession(): { status: "loading" | "authenticated" | "anonymous"; user: SessionUserView | null; reason?: "account_removed" } {
  const q = useQuery({ queryKey: ["session"], queryFn: fetchSession, staleTime: 60_000 });
  if (q.isPending) return { status: "loading", user: null };
  if (q.data?.authenticated) return { status: "authenticated", user: q.data.user };
  return { status: "anonymous", user: null, reason: q.data?.reason };
}
