import "server-only";
import { request } from "undici";

/** undici types its own FormData; the global one is the same runtime class (verified by internal-fetch.test.ts). */
type UndiciBody = NonNullable<Parameters<typeof request>[1]>["body"];

export interface InternalInit {
  method: string;
  headers: HeadersInit;
  body?: string | FormData;
  signal?: AbortSignal;
}

/**
 * Server-to-server HTTP for calls that must carry an explicit `Host` header.
 *
 * WHY NOT fetch(): the Fetch spec makes `Host` a forbidden header, so Node's
 * fetch silently drops it. Django then sees the Docker hostname
 * (`uritect:8888`), raises DisallowedHost and the BFF reads a 400 as "session
 * expired". undici.request sends the header as given (found in the Phase 1
 * live check, 2026-10-27).
 */
export async function internalFetch(url: string, init: InternalInit): Promise<Response> {
  const res = await request(url, {
    method: init.method as "GET" | "POST" | "PUT",
    headers: Object.fromEntries(new Headers(init.headers)),
    body: init.body as UndiciBody,
    signal: init.signal,
  });
  const headers = new Headers();
  for (const [name, value] of Object.entries(res.headers)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) headers.append(name, String(v));
  }
  const buf = await res.body.arrayBuffer();
  const empty = res.statusCode === 204 || res.statusCode === 304;
  return new Response(empty ? null : buf, { status: res.statusCode, headers });
}
