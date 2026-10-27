import "server-only";
import { headers as nextHeaders } from "next/headers";
import type { ZodType } from "zod";
import { env } from "@/server/env";
import { internalFetch } from "@/server/http/internal-fetch";
import type { SessionWriter } from "@/server/session/cookies";
import { ensureFreshAccess } from "@/server/session/refresh";
import { AppError } from "@/shared/errors/app-error";
import { mapDjangoResponse, mapNetworkError } from "@/shared/errors/map-response";

export type DjangoBody =
  | { kind: "form"; fields: Record<string, string> } // app: submitForm / FormDataContent
  | { kind: "multipart"; form: FormData } // app: MultiPartFormDataContent
  | { kind: "json"; value: unknown }; // app: setBody(json)

export interface DjangoRequest<T> {
  method: "GET" | "POST" | "PUT";
  /** Relative to /api/web/v1/, e.g. "ai/gallery/favorites/". */
  path: string;
  query?: Record<string, string | number | undefined>;
  /** Resource headers the app sends: project-uuid, pro-uuid, professional-uuid. */
  headers?: Record<string, string>;
  body?: DjangoBody;
  auth: "required" | "optional" | "none";
  schema: ZodType<T>;
  timeoutMs?: number;
  /** Route handlers pass one so refreshed cookies can be written. */
  session?: SessionWriter;
  /** Use a token obtained in this same request (login/verify/social, AI runner) instead of the cookie. */
  accessOverride?: { access: string; userUuid: string };
}

export function djangoUrl(path: string, query?: DjangoRequest<unknown>["query"]): string {
  const url = new URL(`/api/web/v1/${path.replace(/^\/+/, "")}`, env().DJANGO_INTERNAL_URL);
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
  return url.toString();
}

async function clientIp(): Promise<string | undefined> {
  try {
    const h = await nextHeaders();
    return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
  } catch {
    return undefined; // outside a request (background runner)
  }
}

function encodeBody(body: DjangoBody | undefined, headers: Headers): string | FormData | undefined {
  if (!body) return undefined;
  if (body.kind === "form") {
    headers.set("Content-Type", "application/x-www-form-urlencoded");
    return new URLSearchParams(body.fields).toString();
  }
  if (body.kind === "json") {
    headers.set("Content-Type", "application/json");
    return JSON.stringify(body.value);
  }
  return body.form; // fetch sets multipart boundary
}

/** The only server→Django client (architecture/04, F04). Never logs headers or bodies. */
export async function djangoFetch<T>(req: DjangoRequest<T>): Promise<T> {
  const send = async (access: string | undefined, userUuid: string | undefined) => {
    const headers = new Headers({
      Host: env().DJANGO_PUBLIC_HOST,
      Accept: "application/json",
      "Cache-Control": "no-cache, no-store", // mirrors KMP HttpClientFactory defaultRequest
      Pragma: "no-cache",
      "X-Forwarded-Proto": "https",
    });
    const ip = await clientIp();
    if (ip) headers.set("X-Forwarded-For", ip);
    if (access) headers.set("Authorization", `Bearer ${access}`);
    if (userUuid) headers.set("user-uuid", userUuid);
    for (const [k, v] of Object.entries(req.headers ?? {})) headers.set(k, v);
    try {
      const body = encodeBody(req.body, headers); // sets Content-Type before the headers are sent
      return await internalFetch(djangoUrl(req.path, req.query), {
        method: req.method,
        headers,
        body,
        signal: AbortSignal.timeout(req.timeoutMs ?? 20_000),
      });
    } catch (e) {
      throw mapNetworkError(e);
    }
  };

  if (req.auth === "none") return mapDjangoResponse(await send(undefined, undefined), req.schema);

  if (req.accessOverride) {
    return mapDjangoResponse(await send(req.accessOverride.access, req.accessOverride.userUuid), req.schema);
  }

  const fresh = await ensureFreshAccess(req.session);
  if (!fresh) {
    if (req.auth === "required") throw new AppError("UNAUTHORIZED", 401);
    return mapDjangoResponse(await send(undefined, undefined), req.schema);
  }

  let res = await send(fresh.access, fresh.user.uuid);
  if (res.status === 401) {
    const retried = await ensureFreshAccess(req.session, { force: true }); // clock skew / just-expired
    if (!retried) throw new AppError("UNAUTHORIZED", 401);
    res = await send(retried.access, retried.user.uuid);
  }
  try {
    return await mapDjangoResponse(res, req.schema);
  } catch (e) {
    if (e instanceof AppError) console.warn(JSON.stringify({ level: "warn", src: "djangoFetch", path: req.path, status: res.status, code: e.code }));
    throw e;
  }
}
