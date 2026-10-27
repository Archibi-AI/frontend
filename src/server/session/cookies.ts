import "server-only";
import { cookies, headers } from "next/headers";
import type { NextResponse } from "next/server";
import { env } from "@/server/env";
import { jwtExpMs } from "./jwt";
import { signUser, verifyUser, type SessionUser } from "./sign";

export type { SessionUser } from "./sign";
export const COOKIE = { access: "ab_at", refresh: "ab_rt", user: "ab_u" } as const;
/** Set by proxy.ts after a refresh so server components in the same request see the fresh token. */
export const FRESH_ACCESS_HEADER = "x-ab-at";

export interface TokenPair { access: string; access_exp: number; refresh: string; refresh_exp: number }
export interface SessionTokens { access: string | null; accessExp: number; refresh: string | null; user: SessionUser | null }
export interface CookieOptions { httpOnly: boolean; secure: boolean; sameSite: "lax"; path: string; maxAge: number }

/** Anything that can set cookies: cookies() in route handlers, or NextResponse.cookies in proxy.ts. */
export interface SessionWriter {
  set(name: string, value: string, opts: CookieOptions): void;
  delete(name: string): void;
}

export function cookieOptions(expMs: number): CookieOptions {
  return {
    httpOnly: true,
    // Secure follows the public origin's scheme: always on for https://archibi.ca, off for the
    // http://localhost local stack (Safari refuses Secure cookies over plain http).
    secure: env().NODE_ENV === "production" && env().PUBLIC_ORIGIN.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(1, Math.floor((expMs - Date.now()) / 1000)),
  };
}

export async function routeHandlerWriter(): Promise<SessionWriter> {
  const jar = await cookies();
  return { set: (n, v, o) => jar.set(n, v, o), delete: (n) => jar.delete(n) };
}

export function responseWriter(res: NextResponse): SessionWriter {
  return { set: (n, v, o) => res.cookies.set(n, v, o), delete: (n) => res.cookies.delete(n) };
}

export function writeSession(w: SessionWriter, pair: TokenPair, user: SessionUser): void {
  w.set(COOKIE.access, pair.access, cookieOptions(pair.access_exp));
  w.set(COOKIE.refresh, pair.refresh, cookieOptions(pair.refresh_exp));
  w.set(COOKIE.user, signUser(user), cookieOptions(pair.refresh_exp));
}

export function writeUser(w: SessionWriter, user: SessionUser, refreshExpMs: number): void {
  w.set(COOKIE.user, signUser(user), cookieOptions(refreshExpMs));
}

export function clearSession(w: SessionWriter): void {
  for (const name of Object.values(COOKIE)) w.delete(name);
}

/** Current tokens for this request; the proxy-forwarded fresh access token wins over the cookie. */
export async function getSessionTokens(): Promise<SessionTokens> {
  const jar = await cookies();
  const forwarded = (await headers()).get(FRESH_ACCESS_HEADER);
  const access = forwarded ?? jar.get(COOKIE.access)?.value ?? null;
  return {
    access,
    accessExp: jwtExpMs(access),
    refresh: jar.get(COOKIE.refresh)?.value ?? null,
    user: verifyUser(jar.get(COOKIE.user)?.value),
  };
}
