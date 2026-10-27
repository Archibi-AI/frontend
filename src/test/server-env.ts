/** Valid server env for unit tests (never real values). */
export const TEST_ENV = {
  NODE_ENV: "test",
  DJANGO_INTERNAL_URL: "http://uritect:8888",
  DJANGO_PUBLIC_HOST: "api.uritect.com",
  AI_PROVIDER_ALLOWED_HOSTS: "ai.example.com,api.replicate.com",
  REDIS_URL: "redis://:pw@localhost:6379/0",
  BFF_COOKIE_SECRET: "test-secret-test-secret-test-secret-0123",
  PUBLIC_ORIGIN: "https://archibi.ca",
} as const;

export function applyTestEnv(): void {
  Object.assign(process.env, TEST_ENV);
}
