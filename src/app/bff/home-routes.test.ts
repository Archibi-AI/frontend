// @vitest-environment node
import RedisMock from "ioredis-mock";
import type Redis from "ioredis";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recallItem } from "@/features/ideabank/server/item-cache";
import { setRedisForTests } from "@/server/redis";
import { COOKIE } from "@/server/session/cookies";
import { clearInflightForTests } from "@/server/session/refresh";
import { signUser } from "@/server/session/sign";
import { fakeJwt, jar, resetNextHeaders } from "@/test/next-headers";
import { applyTestEnv } from "@/test/server-env";

applyTestEnv();
type Init = { method: string; headers: HeadersInit };
let calls: Array<{ url: string; init: Init }> = [];
let responder: () => Response = () => new Response("{}", { status: 200 });
vi.mock("@/server/http/internal-fetch", () => ({
  internalFetch: async (url: string, init: Init) => { calls.push({ url, init }); return responder(); },
}));

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const get = (path: string) => new NextRequest(`https://archibi.ca${path}`);
const signIn = () => {
  jar.set(COOKIE.access, { value: fakeJwt(Math.floor(Date.now() / 1000) + 600) });
  jar.set(COOKIE.refresh, { value: fakeJwt(Math.floor(Date.now() / 1000) + 86400) });
  jar.set(COOKIE.user, { value: signUser({ uuid: "user-1", username: "a", email: "a@b.c", imageUri: "" }) });
};
const noParams = { params: Promise.resolve({}) };

const { GET: recent } = await import("./home/recent-projects/route");
const { GET: ideas } = await import("./home/ideas/route");

describe("/bff/home/*", () => {
  beforeEach(() => {
    calls = [];
    resetNextHeaders();
    clearInflightForTests();
    setRedisForTests(new RedisMock() as unknown as Redis);
  });

  it("recent projects call Django with the user's token and uuid", async () => {
    signIn();
    responder = () => json({ projects: [{ uuid: 1, type: "creative_redesign", generatedImage: "https://s/a.png" }] });
    const res = await recent(get("/bff/home/recent-projects"), noParams);
    expect(res.status).toBe(200);
    expect((await res.json()).projects).toHaveLength(1);
    expect(new URL(calls[0]!.url).pathname).toBe("/api/web/v1/user/ai/recent-projects/");
    expect(new Headers(calls[0]!.init.headers).get("user-uuid")).toBe("user-1");
  });

  it("ideas are remembered for the post dialog", async () => {
    signIn();
    responder = () => json({ ideas: [{ uuid: 7, title: null, image: "https://s/7.jpg", thumbnail: null }] });
    const res = await ideas(get("/bff/home/ideas"), noParams);
    expect(res.status).toBe(200);
    expect(new URL(calls[0]!.url).pathname).toBe("/api/web/v1/ai/gallery/homepage-ideas/");
    expect(await recallItem(7)).toEqual({ image: "https://s/7.jpg", width: null, height: null });
  });

  it.each([["recent", recent], ["ideas", ideas]] as const)("%s without a session → 401, Django not called", async (_n, route) => {
    const res = await route(get("/bff/home/x"), noParams);
    expect(res.status).toBe(401);
    expect(calls).toHaveLength(0);
  });
});
