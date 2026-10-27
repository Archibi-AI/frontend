// @vitest-environment node
import RedisMock from "ioredis-mock";
import type Redis from "ioredis";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recallItem } from "@/features/ideabank/server/item-cache";
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
const posts = [{ uuid: 341, image: "https://signed.example/341.jpg", width: 800, height: 600 }, { uuid: 342, image: "https://signed.example/342.jpg" }];
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

describe("BFF /bff/ideabank/*", () => {
  it("tags: I1 with the tab type, public (no Authorization)", async () => {
    responder = () => json([{ id: 12, tag: "Scandinavian" }]);
    const { GET } = await import("./ideabank/tags/route");
    const res = await GET(get("/bff/ideabank/tags?type=exterior"), ctx({}));
    expect(await res.json()).toEqual([{ id: 12, tag: "Scandinavian" }]);
    expect(query(0).pathname).toBe("/api/web/v1/ai/gallery/main-menu/tags/");
    expect(query(0).searchParams.get("type")).toBe("exterior");
    expect(header(0, "Authorization")).toBeNull();
  });

  it("tags: an unknown type is refused before Django", async () => {
    const { GET } = await import("./ideabank/tags/route");
    expect((await GET(get("/bff/ideabank/tags?type=kitchen"), ctx({}))).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("posts without tags → I2 main-menu/posts with type + page; items remembered", async () => {
    responder = () => json({ posts });
    const { GET } = await import("./ideabank/posts/route");
    const res = await GET(get("/bff/ideabank/posts?type=landscape&page=2"), ctx({}));
    expect(res.status).toBe(200);
    expect(query(0).pathname).toBe("/api/web/v1/ai/gallery/main-menu/posts/");
    expect([query(0).searchParams.get("type"), query(0).searchParams.get("page")]).toEqual(["landscape", "2"]);
    await vi.waitFor(async () => expect(await recallItem(341)).toEqual({ image: "https://signed.example/341.jpg", width: 800, height: 600 }));
    expect(await recallItem(342)).toEqual({ image: "https://signed.example/342.jpg", width: null, height: null });
  });

  it("posts with tags → I3 tags/posts with id=12,15 (the app joins the selected ids)", async () => {
    responder = () => json({ posts });
    const { GET } = await import("./ideabank/posts/route");
    await GET(get("/bff/ideabank/posts?type=interior&tags=12,15&page=1"), ctx({}));
    expect(query(0).pathname).toBe("/api/web/v1/ai/gallery/tags/posts/");
    expect(query(0).searchParams.get("id")).toBe("12,15");
  });

  it("posts: malformed tags are refused (no injection into the Django query)", async () => {
    const { GET } = await import("./ideabank/posts/route");
    for (const tags of ["1;drop", "a,b", "1,,2", ","]) expect((await GET(get(`/bff/ideabank/posts?tags=${encodeURIComponent(tags)}`), ctx({}))).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("posts: end of list reaches the browser as INVALID_PAGE", async () => {
    responder = () => json({ detail: "Invalid page." }, 404);
    const { GET } = await import("./ideabank/posts/route");
    const res = await GET(get("/bff/ideabank/posts?type=interior&page=9"), ctx({}));
    expect([res.status, (await res.json()).error.code]).toEqual([404, "INVALID_PAGE"]);
  });

  it("post: I4 with project_uuid; anonymous works; the remembered image is merged in", async () => {
    await (await import("@/features/ideabank/server/item-cache")).rememberItems(posts);
    responder = () => json({ tags: [{ id: 12, tag: "Scandinavian" }], googlePlay: "https://play.google.com/x", likeStatus: { hasUserLiked: false, count: 3 }, isFavorite: false });
    const { GET } = await import("./ideabank/posts/[uuid]/route");
    const res = await GET(get("/bff/ideabank/posts/341"), ctx({ uuid: "341" }));
    const body = await res.json();
    expect(body).toEqual({ uuid: 341, tags: [{ id: 12, tag: "Scandinavian" }], isFavorite: false, likeCount: 3, item: { image: "https://signed.example/341.jpg", width: 800, height: 600 } });
    expect(JSON.stringify(body)).not.toContain("play.google.com"); // the app's store link is not exposed on the web
    expect(query(0).searchParams.get("project_uuid")).toBe("341");
    expect(header(0, "Authorization")).toBeNull();
  });

  it("post: a signed-in user sends Bearer + user-uuid so isFavorite is theirs", async () => {
    signIn();
    responder = () => json({ tags: [], isFavorite: true });
    const { GET } = await import("./ideabank/posts/[uuid]/route");
    const body = await (await GET(get("/bff/ideabank/posts/7"), ctx({ uuid: "7" }))).json();
    expect(body.isFavorite).toBe(true);
    expect(header(0, "Authorization")).toMatch(/^Bearer /);
    expect(header(0, "user-uuid")).toBe("u1");
    expect(body.item).toBeNull(); // nothing remembered for this post
  });

  it("post: non-numeric id → 404 without a Django call", async () => {
    const { GET } = await import("./ideabank/posts/[uuid]/route");
    expect((await GET(get("/bff/ideabank/posts/abc"), ctx({ uuid: "abc" }))).status).toBe(404);
    expect(calls).toHaveLength(0);
  });

  it("favorite: POST with the id in the project-uuid HEADER (like the app) and the session's user-uuid", async () => {
    signIn();
    responder = () => json({ isFavorite: true });
    const { POST } = await import("./ideabank/posts/[uuid]/favorite/route");
    const res = await POST(post("/bff/ideabank/posts/341/favorite"), ctx({ uuid: "341" }));
    expect(await res.json()).toEqual({ isFavorite: true });
    expect(query(0).pathname).toBe("/api/web/v1/ai/gallery/post/favorite/");
    expect(calls[0]!.init.method).toBe("POST");
    expect(header(0, "project-uuid")).toBe("341");
    expect(header(0, "user-uuid")).toBe("u1");
  });

  it("favorite: signed out → 401 UNAUTHORIZED and Django is never called", async () => {
    const { POST } = await import("./ideabank/posts/[uuid]/favorite/route");
    const res = await POST(post("/bff/ideabank/posts/341/favorite"), ctx({ uuid: "341" }));
    expect([res.status, (await res.json()).error.code]).toEqual([401, "UNAUTHORIZED"]);
    expect(calls).toHaveLength(0);
  });

  it("favorite: cross-origin POST is refused (same-origin guard)", async () => {
    signIn();
    const { POST } = await import("./ideabank/posts/[uuid]/favorite/route");
    const evil = new NextRequest("https://archibi.ca/bff/ideabank/posts/341/favorite", { method: "POST", headers: { origin: "https://evil.example" } });
    expect((await POST(evil, ctx({ uuid: "341" }))).status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("favorite: a post that does not exist is a 400 with the backend text", async () => {
    signIn();
    responder = () => json({ message: "this post does not exist!" }, 404);
    const { POST } = await import("./ideabank/posts/[uuid]/favorite/route");
    const res = await POST(post("/bff/ideabank/posts/999/favorite"), ctx({ uuid: "999" }));
    expect(res.status).toBe(404);
  });
});

describe("item cache", () => {
  it("expires after a week and ignores corrupt entries", async () => {
    const { rememberItems, recallItem: recall } = await import("@/features/ideabank/server/item-cache");
    await rememberItems(posts);
    const ttl = await redis.ttl("ab:gallery:item:341");
    expect(ttl).toBeGreaterThan(6 * 24 * 3600);
    expect(ttl).toBeLessThanOrEqual(7 * 24 * 3600);
    await redis.set("ab:gallery:item:5", "{not json");
    expect(await recall(5)).toBeNull();
    expect(await recall(404)).toBeNull();
  });
});
