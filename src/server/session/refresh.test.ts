// @vitest-environment node
import RedisMock from "ioredis-mock";
import type Redis from "ioredis";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyTestEnv } from "@/test/server-env";
import { cookieStore, fakeJwt, jar, resetNextHeaders } from "@/test/next-headers";
import { setRedisForTests } from "@/server/redis";
import { COOKIE } from "./cookies";
import { clearInflightForTests, ensureFreshAccess, refreshCacheKey, singleFlight } from "./refresh";
import { signUser } from "./sign";

applyTestEnv();
const user = { uuid: "5c1", username: "a@b.c", email: "a@b.c", imageUri: "" };
const writer = { set: cookieStore.set, delete: cookieStore.delete };
const nowS = () => Math.floor(Date.now() / 1000);
const pair = () => ({ access: fakeJwt(nowS() + 900), access_exp: Date.now() + 900_000, refresh: `r-${Math.random()}`, refresh_exp: Date.now() + 1e9 });

let fetchMock: ReturnType<typeof vi.fn>;
vi.mock("@/server/http/internal-fetch", () => ({ internalFetch: (...args: unknown[]) => fetchMock(...args) }));

function session(accessExpS: number) {
  jar.set(COOKIE.access, { value: fakeJwt(accessExpS) });
  jar.set(COOKIE.refresh, { value: "old-refresh" });
  jar.set(COOKIE.user, { value: signUser(user) });
}

describe("single-flight refresh (F06)", () => {
  beforeEach(async () => {
    resetNextHeaders();
    clearInflightForTests();
    const mock = new RedisMock();
    await mock.flushall(); // ioredis-mock shares data between instances
    setRedisForTests(mock as unknown as Redis);
    fetchMock = vi.fn(async () => new Response(JSON.stringify(pair()), { status: 200 }));
  });

  it("R1 valid access → no network", async () => {
    session(nowS() + 600);
    expect((await ensureFreshAccess(writer))?.user).toEqual(user);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("R2 access expiring within 30 s → one refresh, cookies written", async () => {
    session(nowS() + 10);
    const fresh = await ensureFreshAccess(writer);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("http://uritect:8888/api/web/v1/auth/token/refresh/");
    expect(JSON.parse(init.body)).toEqual({ refresh: "old-refresh" });
    expect(new Headers(init.headers).get("Host")).toBe("api.uritect.com");
    expect(jar.get(COOKIE.access)?.value).toBe(fresh?.access);
  });

  it("R3 ten concurrent callers → exactly one Django call", async () => {
    session(nowS() - 5);
    await Promise.all(Array.from({ length: 10 }, () => ensureFreshAccess(writer)));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("R4 replay of the old refresh within 60 s is served from Redis (0 calls)", async () => {
    await singleFlight("old-refresh");
    clearInflightForTests(); // simulate another worker / later request
    fetchMock.mockClear();
    const again = await singleFlight("old-refresh");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(again.access).toBeTruthy();
    expect(refreshCacheKey("old-refresh")).toMatch(/^ab:refresh:[0-9a-f]{64}$/);
  });

  it("R5 Django 401 → anonymous and cookies cleared", async () => {
    session(nowS() - 5);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ message: "session expired" }), { status: 401 }));
    expect(await ensureFreshAccess(writer)).toBeNull();
    expect(jar.size).toBe(0);
  });

  it("R6 Django 500 → throws SERVER, cookies kept", async () => {
    session(nowS() - 5);
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 500 }));
    await expect(ensureFreshAccess(writer)).rejects.toMatchObject({ code: "SERVER" });
    expect(jar.has(COOKIE.refresh)).toBe(true);
  });

  it("R7 force refreshes even with a valid access token", async () => {
    session(nowS() + 600);
    await ensureFreshAccess(writer, { force: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("anonymous when there is no refresh cookie", async () => {
    expect(await ensureFreshAccess(writer)).toBeNull();
  });
});
