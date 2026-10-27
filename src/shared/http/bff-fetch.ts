import { AppError } from "@/shared/errors/app-error";

type Query = Record<string, string | number | undefined>;

/** Browser → same-origin /bff/* only (R6). Throws AppError; a 401 sends the user to login with `next`. */
export async function bffFetch<T>(path: `/bff/${string}`, init: RequestInit & { query?: Query } = {}): Promise<T> {
  const { query, ...rest } = init;
  const url = new URL(path, window.location.origin);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
  let res: Response;
  try {
    res = await fetch(url, { ...rest, credentials: "same-origin", cache: "no-store" });
  } catch {
    throw new AppError("NO_INTERNET", 0);
  }
  const body: unknown = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const err = AppError.fromBody(body, res.status);
    if (err.code === "UNAUTHORIZED") {
      // Intentional full navigation: called outside React (no router), and the BFF has already cleared the session cookies.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/auth/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    }
    throw err;
  }
  return body as T;
}

export const jsonInit = (method: "POST" | "PUT", body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
