// @vitest-environment node
import RedisMock from "ioredis-mock";
import type Redis from "ioredis";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const nowS = () => Math.floor(Date.now() / 1000);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const post = (path: string, body: unknown) => new NextRequest(`https://archibi.ca${path}`, { method: "POST", headers: { origin: "https://archibi.ca", "content-type": "application/json" }, body: JSON.stringify(body) });
const get = (path: string) => new NextRequest(`https://archibi.ca${path}`);
const ctx = { params: Promise.resolve({}) };
const path = (i: number) => new URL(calls[i]!.url).pathname;
const sent = (i: number) => JSON.parse(String(calls[i]!.init.body)) as Record<string, unknown>;

beforeEach(async () => {
  resetNextHeaders();
  clearInflightForTests();
  calls = [];
  const mock = new RedisMock();
  await mock.flushall();
  setRedisForTests(mock as unknown as Redis);
  jar.set(COOKIE.access, { value: fakeJwt(nowS() + 600) });
  jar.set(COOKIE.refresh, { value: fakeJwt(nowS() + 86400) });
  jar.set(COOKIE.user, { value: signUser({ uuid: "u1", username: "a@b.co", email: "a@b.co", imageUri: "" }) });
});

describe("BFF /bff/billing/*", () => {
  it("subscription checkout, subscription, plans and enterprise hit the mirrored endpoints", async () => {
    responder = (url) => {
      if (url.includes("stripe/checkout")) return json({ clientSecret: null, publishableKey: "pk", stripeSubscriptionId: "sub_1", plan: { uuid: 3, name: "Pro", maxCredits: 50, period: "month", platforms: "stripe", amount: 1999, currency: "cad" } }, 201);
      if (url.includes("enterprise")) return json({ url: "https://archibi.ca/enterprise" });
      if (url.endsWith("subscriptions/me/")) return json({ subscriptionCredits: 0, purchasedCredits: 0, totalCredits: 0, subscription: null });
      return json({ userCredits: 0, subscriptionCredits: 0, purchasedCredits: 0, plans: [] });
    };
    const checkout = await import("./billing/subscription/checkout/route");
    expect((await checkout.POST(post("/bff/billing/subscription/checkout", { priceId: "price_m" }), ctx)).status).toBe(200);
    expect(sent(0)).toEqual({ priceId: "price_m" });
    const me = await import("./billing/subscription/route");
    expect((await me.GET(get("/bff/billing/subscription"), ctx)).status).toBe(200);
    expect(path(1)).toBe("/api/web/v1/premium/subscriptions/me/");
    const plans = await import("./billing/subscription-plans/route");
    expect((await plans.GET(get("/bff/billing/subscription-plans"), ctx)).status).toBe(200);
    expect(path(2)).toBe("/api/web/v1/premium/subscriptions/");
    const enterprise = await import("./billing/enterprise/route");
    expect((await enterprise.POST(post("/bff/billing/enterprise", {}), ctx)).status).toBe(200);
    expect(sent(3)).toEqual({ platform: "other" });
  });

  it("anonymous callers get 401 and cross-origin posts 403", async () => {
    jar.clear();
    responder = () => json({}, 200);
    const { POST } = await import("./billing/subscription/checkout/route");
    const cross = new NextRequest("https://archibi.ca/bff/billing/subscription/checkout", { method: "POST", headers: { origin: "https://evil.example", "content-type": "application/json" }, body: "{}" });
    expect((await POST(cross, ctx)).status).toBe(403);
    expect(calls).toHaveLength(0);
  });
});
