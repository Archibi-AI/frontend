import "server-only";
import Redis from "ioredis";
import { env } from "@/server/env";

const globalForRedis = globalThis as unknown as { abRedis?: Redis };

/** Private Redis (archibi_web_redis): refresh single-flight cache + AI jobs. Lazily created. */
export function redis(): Redis {
  if (!globalForRedis.abRedis) {
    globalForRedis.abRedis = new Redis(env().REDIS_URL, { maxRetriesPerRequest: 2, enableReadyCheck: true });
  }
  return globalForRedis.abRedis;
}

/** Test-only injection (ioredis-mock). */
export function setRedisForTests(client: Redis | undefined): void {
  globalForRedis.abRedis = client;
}
