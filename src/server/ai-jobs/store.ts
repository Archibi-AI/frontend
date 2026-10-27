import "server-only";
import { redis } from "@/server/redis";
import type { Service } from "@/features/ai/schemas";

/** Redis layout of architecture/07 §3. The provider url/headers/body are NEVER stored. */
export type JobState = "PROVIDER_RUNNING" | "PROVIDER_DONE" | "SAVING" | "DONE" | "FAILED";
export interface JobRecord {
  owner: string;
  service: Service;
  mode: string;
  state: JobState;
  providerOutput?: string;
  result?: string;
  errorCode?: string;
  errorMessage?: string;
  attempts: number;
  createdAt: number;
  updatedAt: number;
  filters: string;
}
export const JOB_TTL = 7200;
export const SAVE_LOCK_TTL = 120;
export const jobKey = (id: string) => `ab:aijob:${id}`;
export const saveLockKey = (id: string) => `ab:aijob:${id}:save`;
export const userJobsKey = (uuid: string) => `ab:aijobs:user:${uuid}`;

export async function createJob(id: string, rec: Omit<JobRecord, "attempts" | "createdAt" | "updatedAt">): Promise<void> {
  const now = Date.now();
  const fields: Record<string, string | number> = { ...rec, attempts: 0, createdAt: now, updatedAt: now };
  await redis()
    .multi()
    .hset(jobKey(id), fields)
    .expire(jobKey(id), JOB_TTL)
    .lpush(userJobsKey(rec.owner), id)
    .ltrim(userJobsKey(rec.owner), 0, 19)
    .expire(userJobsKey(rec.owner), JOB_TTL)
    .exec();
}

export async function patchJob(id: string, patch: Partial<JobRecord>): Promise<void> {
  const fields: Record<string, string | number> = { updatedAt: Date.now() };
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) fields[k] = v as string | number;
  await redis().multi().hset(jobKey(id), fields).expire(jobKey(id), JOB_TTL).exec();
}

export async function readJob(id: string): Promise<JobRecord | null> {
  const h = await redis().hgetall(jobKey(id));
  if (!h || Object.keys(h).length === 0) return null;
  return {
    owner: h.owner ?? "",
    service: h.service as Service,
    mode: h.mode ?? "-",
    state: h.state as JobState,
    providerOutput: h.providerOutput,
    result: h.result,
    errorCode: h.errorCode,
    errorMessage: h.errorMessage,
    attempts: Number(h.attempts ?? 0),
    createdAt: Number(h.createdAt ?? 0),
    updatedAt: Number(h.updatedAt ?? 0),
    filters: h.filters ?? "[]",
  };
}

export async function acquireSaveLock(id: string): Promise<boolean> {
  return (await redis().set(saveLockKey(id), "1", "EX", SAVE_LOCK_TTL, "NX")) === "OK";
}

export async function recentJobs(owner: string): Promise<Array<{ projectUuid: string; service: Service; state: JobState; createdAt: number }>> {
  const ids = await redis().lrange(userJobsKey(owner), 0, 19);
  const pipe = redis().pipeline();
  for (const id of ids) pipe.hmget(jobKey(id), "service", "state", "createdAt", "owner");
  const rows = (await pipe.exec()) ?? [];
  const out: Array<{ projectUuid: string; service: Service; state: JobState; createdAt: number }> = [];
  rows.forEach(([, v], i) => {
    const [service, state, createdAt, o] = (v ?? []) as Array<string | null>;
    if (service && state && o === owner) out.push({ projectUuid: ids[i]!, service: service as Service, state: state as JobState, createdAt: Number(createdAt) });
  });
  return out;
}
