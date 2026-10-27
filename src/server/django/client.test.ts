// @vitest-environment node
import RedisMock from "ioredis-mock";
import type Redis from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { applyTestEnv } from "@/test/server-env";
import { cookieStore, fakeJwt, incoming, jar, resetNextHeaders } from "@/test/next-headers";
import { setRedisForTests } from "@/server/redis";
import { COOKIE } from "@/server/session/cookies";
import { clearInflightForTests } from "@/server/session/refresh";
import { signUser } from "@/server/session/sign";
import { djangoFetch } from "./client";

applyTestEnv();
const schema = z.object({ ok: z.boolean() });
const writer = { set: cookieStore.set, delete: cookieStore.delete };
const nowS = () => Math.floor(Date.now() / 1000);
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

let fetchMock: ReturnType<typeof vi.fn>;
vi.mock("@/server/http/internal-fetch", () => ({ internalFetch: (...args: unknown[]) => fetchMock(...args) }));
const call = (i: number) => fetchMock.mock.calls[i] as [string, RequestInit & { headers: Headers }];

function signedIn(accessExpS = nowS() + 600) {
  jar.set(COOKIE.access, { value: fakeJwt(accessExpS) });
  jar.set(COOKIE.refresh, { value: "r" });
  jar.set(COOKIE.user, { value: signUser({ uuid: "u-1", username: "a", email: "a@b.c", imageUri: "" }) });
}

describe("djangoFetch (F04)", () => {
  beforeEach(async () => {
    resetNextHeaders();
    clearInflightForTests();
    const mock = new RedisMock();
    await mock.flushall(); // ioredis-mock shares data between instances
    setRedisForTests(mock as unknown as Redis);
    fetchMock = vi.fn(async () => json(200, { ok: true }));
  });

  it("D1 GET builds the internal URL, Host and no-cache headers", async () => {
    await djangoFetch({ method: "GET", path: "ai/gallery/main-menu/posts/", query: { type: "interior", page: 2, skip: undefined }, auth: "none", schema });
    const [url, init] = call(0);
    expect(url).toBe("http://uritect:8888/api/web/v1/ai/gallery/main-menu/posts/?type=interior&page=2");
    expect(init.headers.get("Host")).toBe("api.uritect.com");
    expect(init.headers.get("Cache-Control")).toBe("no-cache, no-store");
    expect(init.headers.get("Authorization")).toBeNull();
  });

  it("D2 required auth sends Bearer + user-uuid", async () => {
    signedIn();
    await djangoFetch({ method: "GET", path: "user/ai/credits/", auth: "required", schema, session: writer });
    expect(call(0)[1].headers.get("Authorization")).toMatch(/^Bearer ey/);
    expect(call(0)[1].headers.get("user-uuid")).toBe("u-1");
  });

  it("D3 required auth without a session → UNAUTHORIZED, no network", async () => {
    await expect(djangoFetch({ method: "GET", path: "user/ai/credits/", auth: "required", schema })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("D4 optional auth without a session → anonymous request", async () => {
    await djangoFetch({ method: "GET", path: "ai/gallery/post/", query: { project_uuid: 1 }, auth: "optional", schema });
    expect(call(0)[1].headers.get("Authorization")).toBeNull();
  });

  it("D5 form body is urlencoded (app submitForm)", async () => {
    await djangoFetch({ method: "POST", path: "user/password-recovery/", body: { kind: "form", fields: { email: "a@b.c" } }, auth: "none", schema });
    expect(call(0)[1].headers.get("Content-Type")).toBe("application/x-www-form-urlencoded");
    expect(call(0)[1].body).toBe("email=a%40b.c");
  });

  it("D6 multipart passes FormData untouched (boundary set by fetch)", async () => {
    const form = new FormData();
    form.set("designType", "Interior");
    await djangoFetch({ method: "POST", path: "ai/creative-redesign/process/", body: { kind: "multipart", form }, auth: "none", schema });
    expect(call(0)[1].body).toBe(form);
    expect(call(0)[1].headers.get("Content-Type")).toBeNull();
  });

  it("D7 json body", async () => {
    await djangoFetch({ method: "POST", path: "user/account/delete/", body: { kind: "json", value: { confirmation: "DELETE" } }, auth: "none", schema });
    expect(call(0)[1].headers.get("Content-Type")).toBe("application/json");
    expect(call(0)[1].body).toBe('{"confirmation":"DELETE"}');
  });

  it("D8 401 then 200 → one forced refresh and one retry", async () => {
    signedIn();
    const refreshed = { access: fakeJwt(nowS() + 900), access_exp: Date.now() + 9e5, refresh: "r2", refresh_exp: Date.now() + 1e9 };
    fetchMock
      .mockResolvedValueOnce(json(401, {}))
      .mockResolvedValueOnce(json(200, refreshed)) // refresh endpoint
      .mockResolvedValueOnce(json(200, { ok: true }));
    await expect(djangoFetch({ method: "GET", path: "user/ai/credits/", auth: "required", schema, session: writer })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(call(1)[0])).toContain("/auth/token/refresh/");
  });

  it("D9 401 twice → UNAUTHORIZED after exactly 2 Django calls + 1 refresh", async () => {
    signedIn();
    const refreshed = { access: fakeJwt(nowS() + 900), access_exp: Date.now() + 9e5, refresh: "r2", refresh_exp: Date.now() + 1e9 };
    fetchMock.mockResolvedValueOnce(json(401, {})).mockResolvedValueOnce(json(200, refreshed)).mockResolvedValueOnce(json(401, {}));
    await expect(djangoFetch({ method: "GET", path: "user/ai/credits/", auth: "required", schema, session: writer })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("D10 2xx schema mismatch → SERIALIZATION", async () => {
    fetchMock.mockResolvedValueOnce(json(200, { nope: 1 }));
    await expect(djangoFetch({ method: "GET", path: "x/", auth: "none", schema })).rejects.toMatchObject({ code: "SERIALIZATION" });
  });

  it("D11 timeout → REQUEST_TIMEOUT", async () => {
    fetchMock.mockRejectedValueOnce(Object.assign(new Error("t"), { name: "TimeoutError" }));
    await expect(djangoFetch({ method: "GET", path: "x/", auth: "none", schema })).rejects.toMatchObject({ code: "REQUEST_TIMEOUT" });
  });

  it("D12 forwards the client IP for DRF throttles", async () => {
    incoming.set("x-forwarded-for", "203.0.113.9, 10.0.0.1");
    await djangoFetch({ method: "GET", path: "x/", auth: "none", schema });
    expect(call(0)[1].headers.get("X-Forwarded-For")).toBe("203.0.113.9");
  });

  it("D13 never logs the bearer token", async () => {
    signedIn();
    const spy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    fetchMock.mockResolvedValueOnce(json(400, { message: "x" }));
    await djangoFetch({ method: "GET", path: "x/", auth: "required", schema, session: writer }).catch(() => undefined);
    expect(spy.mock.calls.flat().join(" ")).not.toMatch(/Bearer|ey[A-Za-z0-9]/);
    spy.mockRestore();
  });

  it("resource headers pass through (project-uuid etc.)", async () => {
    await djangoFetch({ method: "POST", path: "ai/gallery/post/favorite/", headers: { "project-uuid": "341" }, auth: "none", schema });
    expect(call(0)[1].headers.get("project-uuid")).toBe("341");
  });

  it("accessOverride uses the given token (login/verify/runner)", async () => {
    await djangoFetch({ method: "POST", path: "user/get-details/", auth: "required", accessOverride: { access: "tok", userUuid: "u-9" }, schema });
    expect(call(0)[1].headers.get("Authorization")).toBe("Bearer tok");
    expect(call(0)[1].headers.get("user-uuid")).toBe("u-9");
  });
});
