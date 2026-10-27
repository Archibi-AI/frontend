import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { env } from "@/server/env";
import { internalFetch } from "@/server/http/internal-fetch";
import { redis } from "@/server/redis";
import { AppError } from "@/shared/errors/app-error";
import { clearSession, getSessionTokens, writeSession, type SessionUser, type SessionWriter, type TokenPair } from "./cookies";

/** Shape of POST /api/web/v1/auth/token/refresh/ (frontend/foundation/api/token-refresh.md). */
export const PairSchema = z.object({ access: z.string(), access_exp: z.number(), refresh: z.string(), refresh_exp: z.number() });

export const SKEW_MS = 30_000;
const CACHE_TTL_S = 60;
const inflight = new Map<string, Promise<TokenPair>>();

export const refreshCacheKey = (refresh: string) => `ab:refresh:${createHash("sha256").update(refresh).digest("hex")}`;

async function rotate(refresh: string): Promise<TokenPair> {
  const key = refreshCacheKey(refresh);
  const cached = await redis().get(key);
  if (cached) return PairSchema.parse(JSON.parse(cached));

  const res = await internalFetch(`${env().DJANGO_INTERNAL_URL}/api/web/v1/auth/token/refresh/`, {
    method: "POST",
    headers: { Host: env().DJANGO_PUBLIC_HOST, "Content-Type": "application/json", "Cache-Control": "no-cache, no-store" },
    body: JSON.stringify({ refresh }),
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401 || res.status === 400) throw new AppError("UNAUTHORIZED", 401);
  if (!res.ok) throw new AppError(res.status >= 500 ? "SERVER" : "UNKNOWN", res.status);
  const pair = PairSchema.parse(await res.json());
  // Late requests still carrying the OLD refresh token get the NEW pair instead of replaying it (architecture/06 §3).
  await redis().set(key, JSON.stringify(pair), "EX", CACHE_TTL_S);
  return pair;
}

/** One rotation per refresh token, no matter how many concurrent callers. */
export function singleFlight(refresh: string): Promise<TokenPair> {
  const key = refreshCacheKey(refresh);
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = rotate(refresh).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export interface FreshAccess { access: string; user: SessionUser }

/** A valid access token (refreshing if needed), or null when anonymous. Writes cookies via `writer` after a refresh. */
export async function ensureFreshAccess(writer?: SessionWriter, opts: { force?: boolean } = {}): Promise<FreshAccess | null> {
  const s = await getSessionTokens();
  if (!s.refresh || !s.user) return null;
  const fresh = s.access !== null && s.accessExp - Date.now() > SKEW_MS;
  if (fresh && !opts.force) return { access: s.access as string, user: s.user };
  try {
    const pair = await singleFlight(s.refresh);
    if (writer) writeSession(writer, pair, s.user);
    return { access: pair.access, user: s.user };
  } catch (e) {
    if (e instanceof AppError && e.code === "UNAUTHORIZED") {
      if (writer) clearSession(writer);
      return null;
    }
    throw e;
  }
}

/** Test-only. */
export function clearInflightForTests(): void {
  inflight.clear();
}
