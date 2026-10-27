import type { ZodType } from "zod";
import { AppError } from "./app-error";
import type { DataError } from "./data-error";
import { AppMessages, BackendSignals } from "./messages";

interface DjangoErrorBody {
  message?: string;
  detail?: string;
  code?: string;
}

const ci = (haystack: string, needle: string) => haystack.toLowerCase().includes(needle.toLowerCase());

/** 400 rules in the exact order of the app's responseToResult (HttpClientExt.kt:104-136): first match wins. */
export function map400(body: DjangoErrorBody): DataError {
  const message = body.message ?? "";
  if (body.code === BackendSignals.serviceNotInPlanCode) return "SERVICE_NOT_IN_PLAN";
  if (ci(message, BackendSignals.wrongUsername)) return "USERNAME_IS_NOT_VALID";
  if (ci(message, BackendSignals.wrongPassword)) return "PASSWORD_IS_NOT_VALID";
  if (message === BackendSignals.wrongOldPassword) return "WRONG_OLD_PASSWORD"; // app uses == here
  if (ci(message, BackendSignals.wrongCode)) return "WRONG_VERIFICATION_CODE";
  if (ci(message, BackendSignals.outOfCredit)) return "OUT_OF_CREDIT";
  if (ci(message, BackendSignals.repeatedEmail)) return "REPEATED_EMAIL";
  if (ci(message, BackendSignals.userNotExist)) return "USER_NOT_EXIST";
  return "UNKNOWN";
}

/** 404 rules (HttpClientExt.kt:139-163). */
export function map404(body: DjangoErrorBody | null): DataError {
  if (!body) return "NOT_FOUND";
  if (ci(body.detail ?? "", BackendSignals.invalidPage)) return "INVALID_PAGE";
  if ((body.message ?? "").includes(BackendSignals.wrongEmailForgetPassword)) return "EMAIL_IS_NOT_VALID_FORGET_PASSWORD";
  return "NOT_FOUND";
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return undefined; // unparsable (e.g. Django HTML error page)
  }
}

/**
 * Turns a Django response into the parsed payload or an AppError, rule for rule
 * like the app (architecture/08 §2). The backend's own message is kept on the
 * error when it is user-facing (so screens can show it verbatim).
 */
export async function mapDjangoResponse<T>(res: Response, schema: ZodType<T>): Promise<T> {
  const status = res.status;
  const body = await readJson(res);

  if (status >= 200 && status < 300) {
    const parsed = schema.safeParse(body ?? {});
    if (!parsed.success) throw new AppError("SERIALIZATION", 502);
    return parsed.data;
  }
  if (status === 408) throw new AppError("REQUEST_TIMEOUT", status);
  if (status === 429) throw new AppError("TOO_MANY_REQUESTS", status);
  if (status === 400) {
    if (body === undefined || body === null || typeof body !== "object") throw new AppError("SERIALIZATION", status);
    const b = body as DjangoErrorBody;
    const code = map400(b);
    throw new AppError(code, status, code === "UNKNOWN" && b.message ? b.message : undefined);
  }
  if (status === 401) throw new AppError("UNAUTHORIZED", status);
  if (status === 403) {
    const b = (body ?? {}) as DjangoErrorBody;
    const unavailable = b.code === BackendSignals.subscriptionsUnavailableCode;
    throw new AppError("FORBIDDEN", status, unavailable ? AppMessages.subscriptionsUnavailable : b.detail ?? b.message);
  }
  if (status === 404) throw new AppError(map404(typeof body === "object" ? (body as DjangoErrorBody) : null), status);
  if (status >= 500) throw new AppError("SERVER", status);
  throw new AppError("UNKNOWN", status);
}

/** Network-level failures (HttpClientExt.kt:22-46). */
export function mapNetworkError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  const { name, code } = (e ?? {}) as { name?: string; code?: string };
  if (name === "TimeoutError" || name === "AbortError" || code === "UND_ERR_ABORTED" || code === "UND_ERR_HEADERS_TIMEOUT") {
    return new AppError("REQUEST_TIMEOUT", 408);
  }
  return new AppError("NO_INTERNET", 503);
}
