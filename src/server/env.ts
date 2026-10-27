import "server-only";
import { z } from "zod";

const csv = z.string().transform((s) => s.split(",").map((h) => h.trim()).filter(Boolean));

export const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  DJANGO_INTERNAL_URL: z.string().url(),
  DJANGO_PUBLIC_HOST: z.string().min(1),
  AI_PROVIDER_ALLOWED_HOSTS: csv,
  REDIS_URL: z.string().url(),
  BFF_COOKIE_SECRET: z.string().min(32),
  PUBLIC_ORIGIN: z.string().url(),
});
export type ServerEnv = z.infer<typeof EnvSchema>;

let cached: ServerEnv | null = null;

/**
 * Validated server environment. Parsed lazily so `next build` (which has no
 * runtime secrets) can import server modules; `instrumentation.ts` calls it at
 * server start so a misconfigured container still fails fast.
 */
export function env(): ServerEnv {
  if (!cached) cached = EnvSchema.parse(process.env);
  return cached;
}

/** Test-only: forget the cached env so a test can change process.env. */
export function resetEnvForTests(): void {
  cached = null;
}
