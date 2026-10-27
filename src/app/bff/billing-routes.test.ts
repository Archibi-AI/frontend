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

const catalogue = { userCredits: 3, plans: [{ productId: "price_p20", creditsCount: 20, name: "20 renders", image: "", priceId: "price_p20", amount: 999, currency: "usd" }] };

describe("BFF /bff/billing/*", () => {
  it("credit intent: takes only a price id and asks Django for that pack's own currency (CK1)", async () => {
    responder = (url) => (url.includes("premium/plans") ? json(catalogue) : json({ clientSecret: "pi_secret", publishableKey: "pk_mock_x", amount: 9.99, currency: "usd", credits: 20 }, 201));
    const { POST } = await import("./billing/credits/intent/route");
    const res = await POST(post("/bff/billing/credits/intent", { priceId: "price_p20" }), ctx);
    expect(res.status).toBe(200);
    expect(path(1)).toBe("/api/web/v1/premium/payments/create-intent/");
    expect(sent(1)).toEqual({ price_id: "price_p20", currency: "usd" });
    expect((await POST(post("/bff/billing/credits/intent", { priceId: "price_unknown" }), ctx)).status).toBe(404);
    expect((await POST(post("/bff/billing/credits/intent", {}), ctx)).status).toBe(400);
  });

  it("record: forwards a STRIPE body and refuses transaction fields (CK2)", async () => {
    responder = () => json({ message: "payment_received", detail: "ok", userCredits: 3 });
    const { POST } = await import("./billing/credits/record/route");
    const body = { planId: "price_p20", status: "completed", price: 9.99, creditCount: 20, timestamp: "2026-10-27 10:00:00", currency: "usd" };
    expect((await POST(post("/bff/billing/credits/record", body), ctx)).status).toBe(200);
    expect(path(0)).toBe("/api/web/v1/premium/payments/record/");
    expect(sent(0)).toMatchObject({ ...body, provider: "STRIPE" });
    expect((await POST(post("/bff/billing/credits/record", { ...body, transactionId: "1" }), ctx)).status).toBe(400);
    expect((await POST(post("/bff/billing/credits/record", { ...body, provider: "APPLE_IAP" }), ctx)).status).toBe(400);
    expect(calls).toHaveLength(1);
  });

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
    const { POST } = await import("./billing/credits/record/route");
    const cross = new NextRequest("https://archibi.ca/bff/billing/credits/record", { method: "POST", headers: { origin: "https://evil.example", "content-type": "application/json" }, body: "{}" });
    expect((await POST(cross, ctx)).status).toBe(403);
    expect(calls).toHaveLength(0);
  });
});
