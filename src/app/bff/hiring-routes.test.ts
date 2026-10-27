// @vitest-environment node
import RedisMock from "ioredis-mock";
import type Redis from "ioredis";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recallProfessional } from "@/features/hiring/server/card-cache";
import { setRedisForTests } from "@/server/redis";
import { clearInflightForTests } from "@/server/session/refresh";
import { COOKIE } from "@/server/session/cookies";
import { signUser } from "@/server/session/sign";
import { fakeJwt, jar, resetNextHeaders } from "@/test/next-headers";
import { applyTestEnv } from "@/test/server-env";

applyTestEnv();
type Init = { method: string; headers: HeadersInit; body?: unknown };
let calls: Array<{ url: string; init: Init }> = [];
let responder: (url: string, init: Init) => Response = () => new Response("{}", { status: 200 });
vi.mock("@/server/http/internal-fetch", () => ({
  internalFetch: async (url: string, init: Init) => { calls.push({ url, init }); return responder(url, init); },
}));

let redis: Redis;
const nowS = () => Math.floor(Date.now() / 1000);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const get = (path: string) => new NextRequest(`https://archibi.ca${path}`);
const post = (path: string) => new NextRequest(`https://archibi.ca${path}`, { method: "POST", headers: { origin: "https://archibi.ca", "content-type": "application/json" }, body: "{}" });
const ctx = <P extends object>(params: P) => ({ params: Promise.resolve(params) });
const query = (i: number) => new URL(calls[i]!.url);
const header = (i: number, n: string) => new Headers(calls[i]!.init.headers).get(n);
const signIn = () => {
  jar.set(COOKIE.access, { value: fakeJwt(nowS() + 600) });
  jar.set(COOKIE.refresh, { value: fakeJwt(nowS() + 86400) });
  jar.set(COOKIE.user, { value: signUser({ uuid: "u1", username: "a@b.co", email: "a@b.co", imageUri: "" }) });
};

beforeEach(async () => {
  resetNextHeaders();
  clearInflightForTests();
  calls = [];
  const mock = new RedisMock();
  await mock.flushall();
  redis = mock as unknown as Redis;
  setRedisForTests(redis);
});

const U1 = "11111111-1111-4111-8111-111111111111";
const card = { uuid: U1, fullname: "Alice", profession: "Designer", location: "Toronto", about: "x", image: null, isWishedList: false };

describe("BFF /bff/hiring/*", () => {
  it("categories: H2 with the lowercase type, public", async () => {
    responder = () => json([{ uuid: U1, title: "Interior", image: null }]);
    const { GET } = await import("./hiring/categories/route");
    const res = await GET(get("/bff/hiring/categories?type=constructor"), ctx({}));
    expect(res.status).toBe(200);
    expect(query(0).pathname).toBe("/api/web/v1/hiring/main-menu/categories/");
    expect(query(0).searchParams.get("type")).toBe("constructor");
    expect(header(0, "Authorization")).toBeNull();
    expect((await GET(get("/bff/hiring/categories?type=plumber"), ctx({}))).status).toBe(400);
  });

  it("category professionals: H3 passes category_uuid + the app's filters JSON and remembers the cards", async () => {
    responder = () => json({ professionals: [card] });
    const { GET } = await import("./hiring/category/professionals/route");
    const filters = JSON.stringify([{ title: "tags", options: [{ name: "Modern", isSelected: true }], type: "Optional" }]);
    const res = await GET(get(`/bff/hiring/category/professionals?category=${U1}&page=2&filters=${encodeURIComponent(filters)}`), ctx({}));
    expect(res.status).toBe(200);
    expect(query(0).pathname).toBe("/api/web/v1/hiring/category/professional/");
    expect(query(0).searchParams.get("category_uuid")).toBe(U1);
    expect(query(0).searchParams.get("page")).toBe("2");
    expect(query(0).searchParams.get("filters")).toBe(filters);
    await vi.waitFor(async () => expect(await recallProfessional(U1)).toMatchObject({ fullname: "Alice" }));
    expect((await GET(get("/bff/hiring/category/professionals?category=nope"), ctx({}))).status).toBe(400);
    expect((await GET(get("/bff/hiring/category/professionals?category=7"), ctx({}))).status).toBe(200); // categories have numeric ids
  });

  it("professional page: the id travels in the pro-uuid header (and the query), like the app", async () => {
    const { getProfessionalPage } = await import("@/features/hiring/server/repository");
    responder = () => json({ banner: "", accessibility: 5, tags: ["Modern"], description: "d", contacts: {}, projects: [] });
    await getProfessionalPage(U1);
    expect(header(0, "pro-uuid")).toBe(U1);
    expect(query(0).searchParams.get("pro_uuid")).toBe(U1);
  });

  it("projects: header professional-uuid + query", async () => {
    responder = () => json({ projects: [] });
    const { GET } = await import("./hiring/professionals/[uuid]/projects/route");
    expect((await GET(get("/bff/hiring/professionals/x/projects"), ctx({ uuid: "x" }))).status).toBe(404);
    expect((await GET(get(`/bff/hiring/professionals/${U1}/projects?page=1`), ctx({ uuid: U1 }))).status).toBe(200);
    expect(header(0, "professional-uuid")).toBe(U1);
    expect(query(0).searchParams.get("professional_uuid")).toBe(U1);
  });

  it("wishlist toggle: signed-out is refused; signed-in sends user-uuid + professional-uuid and reports added", async () => {
    const { POST } = await import("./hiring/professionals/[uuid]/wishlist/route");
    expect((await POST(post(`/bff/hiring/professionals/${U1}/wishlist`), ctx({ uuid: U1 }))).status).toBe(401);
    expect(calls).toHaveLength(0);
    signIn();
    responder = () => json({ message: "the professional has been added to your wishlist successfully" });
    const res = await POST(post(`/bff/hiring/professionals/${U1}/wishlist`), ctx({ uuid: U1 }));
    expect(await res.json()).toEqual({ message: "the professional has been added to your wishlist successfully", added: true });
    expect(query(0).pathname).toBe("/api/web/v1/user/hiring/wishlist-check/");
    expect(header(0, "user-uuid")).toBe("u1");
    expect(header(0, "professional-uuid")).toBe(U1);
    responder = () => json({ message: "the professional has been deleted from your wishlist successfully" });
    expect((await (await POST(post(`/bff/hiring/professionals/${U1}/wishlist`), ctx({ uuid: U1 }))).json()).added).toBe(false);
  });

  it("wishlist list: requires a session", async () => {
    const { GET } = await import("./hiring/wishlist/route");
    expect((await GET(get("/bff/hiring/wishlist?page=1"), ctx({}))).status).toBe(401);
  });
});
