import "server-only";
import { env } from "@/server/env";
import { AppError } from "@/shared/errors/app-error";
import type { DynamicConfig } from "@/features/ai/schemas";
import { patchJob } from "./store";

/** D12: exactly the app's policy (AIViewModel.kt:20-41): 5 attempts, 5 000 ms apart, identical request. */
export const MAX_ATTEMPTS = 5;
export const RETRY_DELAY_MS = 5_000;
/** Per attempt: longer than the gateway's wait_seconds (90) plus margin. */
export const ATTEMPT_TIMEOUT_MS = 180_000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function assertAllowedHost(url: string): void {
  const host = new URL(url).host;
  if (!env().AI_PROVIDER_ALLOWED_HOSTS.includes(host)) throw new Error("provider host not allowed");
}

const log = (projectUuid: string, attempt: number, status: number | string) =>
  console.info(JSON.stringify({ level: "info", src: "ai-runner", projectUuid, attempt, status }));

/** Resolves when the call finished (tests await it); production callers do not await. Mirrors submitToDynamicAPI + retry. */
export function startProviderCall(cfg: DynamicConfig): Promise<void> {
  return (async () => {
    const id = cfg.project_uuid;
    try {
      assertAllowedHost(cfg.url);
    } catch {
      log(id, 0, "host-not-allowed");
      await patchJob(id, { state: "FAILED", errorCode: "UNKNOWN" });
      return;
    }
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await patchJob(id, { attempts: attempt });
      try {
        const res = await fetch(cfg.url, {
          method: "POST",
          headers: { ...cfg.headers, "Content-Type": "application/json" }, // app: headers map, then contentType(JSON)
          body: JSON.stringify(cfg.body),
          cache: "no-store",
          signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
        });
        const text = await res.text();
        log(id, attempt, res.status);
        if (res.ok) {
          await patchJob(id, { state: "PROVIDER_DONE", providerOutput: text });
          return;
        }
      } catch {
        log(id, attempt, "network"); // network/timeout -> retry, like the app's safeCall error
      }
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
    await patchJob(id, { state: "FAILED", errorCode: "UNKNOWN" });
  })().catch(() => undefined);
}

/** Furniture: one synchronous Django call that may outlast Cloudflare's 100 s, so it runs here. */
export function startFurnitureCall(id: string, run: () => Promise<unknown>): Promise<void> {
  return (async () => {
    try {
      const r = await run();
      await patchJob(id, { state: "DONE", result: JSON.stringify(r) });
    } catch (e) {
      const err = AppError.from(e);
      await patchJob(id, { state: "FAILED", errorCode: err.code, errorMessage: err.message });
    }
  })().catch(() => undefined);
}
