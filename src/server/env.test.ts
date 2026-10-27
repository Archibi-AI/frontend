import { afterEach, describe, expect, it } from "vitest";
import { EnvSchema, env, resetEnvForTests } from "./env";

const valid = {
  NODE_ENV: "test",
  DJANGO_INTERNAL_URL: "http://uritect:8888",
  DJANGO_PUBLIC_HOST: "api.uritect.com",
  AI_PROVIDER_ALLOWED_HOSTS: "ai.example.com, api.replicate.com",
  REDIS_URL: "redis://:pw@archibi_web_redis:6379/0",
  BFF_COOKIE_SECRET: "x".repeat(32),
  PUBLIC_ORIGIN: "https://archibi.ca",
};

describe("server env", () => {
  afterEach(() => resetEnvForTests());

  it("parses and splits the provider host allowlist", () => {
    expect(EnvSchema.parse(valid).AI_PROVIDER_ALLOWED_HOSTS).toEqual(["ai.example.com", "api.replicate.com"]);
  });

  it("rejects a missing DJANGO_INTERNAL_URL", () => {
    const rest: Partial<typeof valid> = { ...valid };
    delete rest.DJANGO_INTERNAL_URL;
    expect(() => EnvSchema.parse(rest)).toThrow();
  });

  it("rejects a short cookie secret", () => {
    expect(() => EnvSchema.parse({ ...valid, BFF_COOKIE_SECRET: "short" })).toThrow();
  });

  it("env() reads process.env lazily and caches", () => {
    Object.assign(process.env, valid);
    expect(env().DJANGO_PUBLIC_HOST).toBe("api.uritect.com");
  });
});
