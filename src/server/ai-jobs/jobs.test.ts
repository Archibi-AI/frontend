// @vitest-environment node
import RedisMock from "ioredis-mock";
import type Redis from "ioredis";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setRedisForTests } from "@/server/redis";
import { COOKIE } from "@/server/session/cookies";
import { clearInflightForTests } from "@/server/session/refresh";
import { signUser } from "@/server/session/sign";
import { fakeJwt, jar, resetNextHeaders } from "@/test/next-headers";
import { applyTestEnv } from "@/test/server-env";
import { buildDjangoForm } from "./build-form";
import { ATTEMPT_TIMEOUT_MS, MAX_ATTEMPTS, RETRY_DELAY_MS, startFurnitureCall, startProviderCall } from "./runner";
import { createJob, jobKey, patchJob, readJob, recentJobs } from "./store";

applyTestEnv();
type Init = { method: string; headers: HeadersInit; body?: unknown };
let djangoCalls: Array<{ url: string; init: Init }> = [];
let djangoResponder: (url: string, init: Init) => Response = () => new Response("{}", { status: 200 });
vi.mock("@/server/http/internal-fetch", () => ({
  internalFetch: async (url: string, init: Init) => { djangoCalls.push({ url, init }); return djangoResponder(url, init); },
}));

let redis: Redis;
const nowS = () => Math.floor(Date.now() / 1000);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const ID = "11111111-1111-4111-8111-111111111111";
const SECRET_URL = "https://ai.example.com/v1/generations";
const cfg = { url: SECRET_URL, headers: { "X-Uritect-Service-Key": "svc-secret", "X-Uritect-Job-Token": "job-secret" }, body: { job: { id: 7 }, input: { image: "https://signed" } }, project_uuid: ID };
const ctx = <P extends object>(params: P) => ({ params: Promise.resolve(params) });
const signIn = (uuid = "u1") => {
  jar.set(COOKIE.access, { value: fakeJwt(nowS() + 600) });
  jar.set(COOKIE.refresh, { value: fakeJwt(nowS() + 86400) });
  jar.set(COOKIE.user, { value: signUser({ uuid, username: "a@b.co", email: "a@b.co", imageUri: "" }) });
};
const img = () => new File([new Uint8Array([1, 2, 3])], "room.jpg", { type: "image/jpeg" });
const startReq = (fields: Record<string, string>, file: File | null = img()) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  if (file) fd.set("beforeImage", file, file.name);
  return new NextRequest("https://archibi.ca/bff/ai/jobs", { method: "POST", headers: { origin: "https://archibi.ca" }, body: fd });
};

beforeEach(async () => {
  resetNextHeaders();
  clearInflightForTests();
  djangoCalls = [];
  const mock = new RedisMock();
  await mock.flushall();
  redis = mock as unknown as Redis;
  setRedisForTests(redis);
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("runner (J1–J4)", () => {
  const seed = () => createJob(ID, { owner: "u1", service: "interior", mode: "beautiful", state: "PROVIDER_RUNNING", filters: "[]" });

  it("J1: 500 four times then 200 → 5 attempts, 4 × 5 000 ms waits, raw text kept", async () => {
    vi.useFakeTimers();
    await seed();
    let n = 0;
    const fetchMock = vi.fn(async () => (++n < 5 ? new Response("boom", { status: 500 }) : new Response('{"output":"https://x/y.png"}', { status: 200 })));
    vi.stubGlobal("fetch", fetchMock);
    const done = startProviderCall(cfg);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * 4);
    await done;
    expect(fetchMock).toHaveBeenCalledTimes(5);
    const rec = await readJob(ID);
    expect(rec).toMatchObject({ state: "PROVIDER_DONE", providerOutput: '{"output":"https://x/y.png"}', attempts: 5 });
  });

  it("J2: 500 five times → FAILED/UNKNOWN after exactly 5 attempts", async () => {
    vi.useFakeTimers();
    await seed();
    const fetchMock = vi.fn(async () => new Response("boom", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const done = startProviderCall(cfg);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * MAX_ATTEMPTS);
    await done;
    expect(fetchMock).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expect(await readJob(ID)).toMatchObject({ state: "FAILED", errorCode: "UNKNOWN", attempts: 5 });
  });

  it("network errors are retried like non-2xx", async () => {
    vi.useFakeTimers();
    await seed();
    const fetchMock = vi.fn(async () => { throw new TypeError("fetch failed"); });
    vi.stubGlobal("fetch", fetchMock);
    const done = startProviderCall(cfg);
    await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS * MAX_ATTEMPTS);
    await done;
    expect(fetchMock).toHaveBeenCalledTimes(MAX_ATTEMPTS);
    expect((await readJob(ID))?.state).toBe("FAILED");
  });

  it("J3: headers and body are forwarded byte-identical with JSON content type and a per-attempt timeout", async () => {
    await seed();
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await startProviderCall(cfg);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(SECRET_URL);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(cfg.body));
    expect(init.headers).toEqual({ ...cfg.headers, "Content-Type": "application/json" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(ATTEMPT_TIMEOUT_MS).toBeGreaterThan(90_000);
  });

  it("J4: a host that is not allow-listed fails the job with ZERO fetches", async () => {
    await seed();
    const fetchMock = vi.fn(async () => new Response("ok"));
    vi.stubGlobal("fetch", fetchMock);
    await startProviderCall({ ...cfg, url: "https://evil.example.net/v1/generations" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await readJob(ID)).toMatchObject({ state: "FAILED", errorCode: "UNKNOWN" });
  });

  it("furniture runner stores the result, or the failure code", async () => {
    await seed();
    await startFurnitureCall(ID, async () => ({ output: { success: true, result: {} }, leftCredits: 3 }));
    expect(await readJob(ID)).toMatchObject({ state: "DONE" });
    await patchJob(ID, { state: "PROVIDER_RUNNING" });
    const { AppError } = await import("@/shared/errors/app-error");
    await startFurnitureCall(ID, async () => { throw new AppError("OUT_OF_CREDIT", 400); });
    expect(await readJob(ID)).toMatchObject({ state: "FAILED", errorCode: "OUT_OF_CREDIT" });
  });
});

describe("start route (J8–J10, IN3, SKF1)", () => {
  it("J9: OUT_OF_CREDIT from process → 400, no job, runner not started", async () => {
    signIn();
    djangoResponder = () => json({ message: "You are out of Credit!" }, 400);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/bff/ai/jobs/route");
    const res = await POST(startReq({ service: "interior" }), ctx({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("OUT_OF_CREDIT");
    expect(await redis.keys("ab:aijob*")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("SERVICE_NOT_IN_PLAN carries the service key for /ai/service-not-in-plan", async () => {
    signIn();
    djangoResponder = () => json({ code: "service_not_in_plan", message: "Your current plan doesn't include Exterior Design." }, 400);
    const { POST } = await import("@/app/bff/ai/jobs/route");
    const res = await POST(startReq({ service: "exterior" }), ctx({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: { code: "SERVICE_NOT_IN_PLAN" }, service: "exterior_design" });
  });

  it("J10: furniture pre-check with ai_credits 0 → 400 OUT_OF_CREDIT, X7 never called", async () => {
    signIn();
    djangoResponder = (url) => (url.includes("user/ai/credits") ? json({ ai_credits: 0, service_access: { restricted: false, allowed_services: [] } }) : json({}));
    const { POST } = await import("@/app/bff/ai/jobs/route");
    const res = await POST(startReq({ service: "furniture" }), ctx({}));
    expect((await res.json()).error.code).toBe("OUT_OF_CREDIT");
    expect(djangoCalls.map((c) => new URL(c.url).pathname)).toEqual(["/api/web/v1/user/ai/credits/"]);
  });

  it("furniture pre-check blocks a plan that excludes the service", async () => {
    signIn();
    djangoResponder = () => json({ ai_credits: 5, service_access: { restricted: true, plan_name: "Starter", allowed_services: ["interior_design"] } });
    const { POST } = await import("@/app/bff/ai/jobs/route");
    const res = await POST(startReq({ service: "furniture" }), ctx({}));
    expect(await res.json()).toMatchObject({ error: { code: "SERVICE_NOT_IN_PLAN" }, service: "furniture_finder" });
  });

  it("starts a redesign job: 202, owner-scoped record, provider call with the secret config, none of it in Redis or the response", async () => {
    signIn("owner-1");
    djangoResponder = (url) => (url.includes("beautiful-redesign/process") ? json({ url: SECRET_URL, headers: cfg.headers, body: cfg.body, project_uuid: ID }) : json({}));
    const fetchMock = vi.fn(async () => new Response('{"output":"https://x/y.png"}', { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/bff/ai/jobs/route");
    const res = await POST(startReq({ service: "interior", mode: "beautiful", designStyle: "Modern", filterSummary: JSON.stringify([{ title: "Design Style", value: "Modern" }]) }), ctx({}));
    expect(res.status).toBe(202);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ projectUuid: ID });
    expect(text).not.toMatch(/svc-secret|job-secret|ai\.example\.com/);
    await vi.waitFor(async () => expect((await readJob(ID))?.state).toBe("PROVIDER_DONE"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // J8: scan every key and field for provider secrets.
    for (const key of await redis.keys("*")) {
      const dump = JSON.stringify(await redis.hgetall(key).catch(() => ({}))) + JSON.stringify(await redis.lrange(key, 0, -1).catch(() => []));
      expect(dump).not.toMatch(/svc-secret|job-secret|X-Uritect|ai\.example\.com\/v1/);
    }
    expect(await recentJobs("owner-1")).toMatchObject([{ projectUuid: ID, service: "interior", state: "PROVIDER_DONE" }]);
  });

  it("rejects missing, oversized and non-image uploads before calling Django", async () => {
    signIn();
    const { POST } = await import("@/app/bff/ai/jobs/route");
    expect((await POST(startReq({ service: "interior" }, null), ctx({}))).status).toBe(400);
    expect((await POST(startReq({ service: "interior" }, new File(["x"], "a.pdf", { type: "application/pdf" })), ctx({}))).status).toBe(400);
    expect((await POST(startReq({ service: "interior" }, new File([new Uint8Array(15 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" })), ctx({}))).status).toBe(400);
    expect((await POST(startReq({ service: "sketch" }), ctx({}))).status).toBe(400); // sketchPart required
    expect(djangoCalls).toEqual([]);
  });

  it("is same-origin only and needs a session", async () => {
    const { POST } = await import("@/app/bff/ai/jobs/route");
    const cross = new NextRequest("https://archibi.ca/bff/ai/jobs", { method: "POST", headers: { origin: "https://evil.test" }, body: new FormData() });
    expect((await POST(cross, ctx({}))).status).toBe(403);
    expect((await POST(startReq({ service: "interior" }), ctx({}))).status).toBe(401);
  });

  it("IN3: the interior/beautiful multipart equals the app's golden (order, values, empty strings)", () => {
    const form = buildDjangoForm({ service: "interior", mode: "beautiful", values: { designStyle: "Modern", roomType: "Living Room", floorMaterialId: "9" }, file: img() });
    expect([...form.entries()].map(([k, v]) => [k, typeof v === "string" ? v : "<file room.jpg>"])).toEqual([
      ["roomType", "Living Room"], ["designStyle", "Modern"], ["houseAngle", ""], ["prompt", ""],
      ["designType", "Interior"], ["gardenType", ""], ["model", "Beautiful Redesign"], ["floorMaterialId", "9"], ["beforeImage", "<file room.jpg>"],
    ]);
  });

  it("exterior and landscape send their designType (Garden for landscape) and the creative model", () => {
    const keys = (service: "exterior" | "landscape") => Object.fromEntries(buildDjangoForm({ service, mode: "creative", values: {}, file: img() }).entries());
    expect(keys("exterior")).toMatchObject({ designType: "Exterior", model: "Creative Redesign" });
    expect(keys("landscape")).toMatchObject({ designType: "Garden", model: "Creative Redesign" });
  });

  it("SKF1: sketch multipart omits empty fields and `model`, designType is the tab", () => {
    const form = buildDjangoForm({ service: "sketch", mode: "beautiful", sketchPart: "Exterior", values: { designStyle: "Modern", prompt: "" }, file: img() });
    expect([...form.keys()]).toEqual(["designStyle", "designType", "beforeImage"]);
    expect(form.get("designType")).toBe("Exterior");
    expect(form.has("model")).toBe(false);
  });

  it("furniture multipart is the image only", () => {
    expect([...buildDjangoForm({ service: "furniture", mode: "beautiful", values: { prompt: "x" }, file: img() }).keys()]).toEqual(["beforeImage"]);
  });
});

describe("poll route (J5–J7)", () => {
  const poll = async (id = ID) => {
    const { GET } = await import("@/app/bff/ai/jobs/[projectUuid]/route");
    return GET(new NextRequest(`https://archibi.ca/bff/ai/jobs/${id}`), ctx({ projectUuid: id }));
  };
  const seed = (state: "PROVIDER_RUNNING" | "PROVIDER_DONE", service: "interior" | "sketch" = "interior") =>
    createJob(ID, { owner: "u1", service, mode: "beautiful", state, filters: JSON.stringify([{ title: "Design Style", value: "Modern" }]), ...(state === "PROVIDER_DONE" ? { providerOutput: '{"out":1}' } : {}) });
  const saved = { output: "https://signed/out.png", leftCredits: 4, message: "successful", professionals: [] };

  it("running → {state:'running'} with filters; never any provider data", async () => {
    signIn();
    await seed("PROVIDER_RUNNING");
    const body = await (await poll()).json();
    expect(body).toMatchObject({ state: "running", service: "interior", filters: [{ title: "Design Style", value: "Modern" }] });
    expect(JSON.stringify(body)).not.toMatch(/providerOutput|X-Uritect|headers/);
  });

  it("J5: 3 concurrent polls on PROVIDER_DONE → save called once, the others 'saving'", async () => {
    signIn();
    await seed("PROVIDER_DONE");
    djangoResponder = () => json(saved);
    const states = (await Promise.all([poll(), poll(), poll()].map(async (p) => (await p).json()))).map((b) => b.state).sort();
    expect(states).toEqual(["done", "saving", "saving"]);
    const saves = djangoCalls.filter((c) => c.url.includes("redesign/save"));
    expect(saves).toHaveLength(1);
    expect(String(saves[0]!.init.body)).toBe(new URLSearchParams({ output: '{"out":1}', "project-uuid": ID }).toString());
    expect(await (await poll()).json()).toMatchObject({ state: "done", result: saved });
    expect(djangoCalls.filter((c) => c.url.includes("redesign/save"))).toHaveLength(1);
  });

  it("sketch jobs use the sketch save endpoint", async () => {
    signIn();
    await seed("PROVIDER_DONE", "sketch");
    djangoResponder = () => json(saved);
    await poll();
    expect(djangoCalls.some((c) => c.url.includes("sketch-to-render/save"))).toBe(true);
  });

  it("save 400 → failed/UNKNOWN (/ai/error); save 5xx → failed/SERVER (/ai/server-error)", async () => {
    signIn();
    await seed("PROVIDER_DONE");
    djangoResponder = () => json({ message: "something went wrong!" }, 400);
    expect((await (await poll()).json()).error.code).toBe("UNKNOWN");
    await createJob(ID, { owner: "u1", service: "interior", mode: "beautiful", state: "PROVIDER_DONE", filters: "[]", providerOutput: "x" });
    await redis.del(`ab:aijob:${ID}:save`);
    djangoResponder = () => new Response("oops", { status: 502 });
    expect((await (await poll()).json()).error.code).toBe("SERVER");
  });

  it("J6: another user's poll is 404", async () => {
    signIn("someone-else");
    await seed("PROVIDER_RUNNING");
    expect((await poll()).status).toBe(404);
    expect((await poll("22222222-2222-4222-8222-222222222222")).status).toBe(404);
  });

  it("J7: a job RUNNING for more than 10 minutes becomes failed/SERVER", async () => {
    signIn();
    await seed("PROVIDER_RUNNING");
    await redis.hset(jobKey(ID), "updatedAt", String(Date.now() - 11 * 60_000));
    const body = await (await poll()).json();
    expect(body).toMatchObject({ state: "failed", error: { code: "SERVER" } });
  });

  it("a crashed saver (SAVING > 150 s) is reset so the next poll saves again", async () => {
    signIn();
    await seed("PROVIDER_DONE");
    await patchJob(ID, { state: "SAVING" });
    await redis.hset(jobKey(ID), "updatedAt", String(Date.now() - 200_000));
    djangoResponder = () => json(saved);
    expect((await (await poll()).json()).state).toBe("done");
  });

  it("recent jobs lists only the caller's jobs", async () => {
    signIn("u1");
    await seed("PROVIDER_RUNNING");
    const { GET } = await import("@/app/bff/ai/jobs/route");
    const res = await GET(new NextRequest("https://archibi.ca/bff/ai/jobs"), ctx({}));
    expect(await res.json()).toMatchObject([{ projectUuid: ID, service: "interior" }]);
  });

  it("download streams only the owner's finished render with an attachment filename", async () => {
    signIn();
    await createJob(ID, { owner: "u1", service: "interior", mode: "beautiful", state: "DONE", filters: "[]", result: JSON.stringify(saved) });
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/png" } })));
    const { GET } = await import("@/app/bff/ai/jobs/[projectUuid]/download/route");
    const res = await GET(new NextRequest(`https://archibi.ca/bff/ai/jobs/${ID}/download`), ctx({ projectUuid: ID }));
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="archibi-interior-11111111.jpg"');
    expect(res.headers.get("content-type")).toBe("image/png");
    signIn("other");
    expect((await GET(new NextRequest(`https://archibi.ca/bff/ai/jobs/${ID}/download`), ctx({ projectUuid: ID }))).status).toBe(404);
  });
});
