// @vitest-environment node
import RedisMock from "ioredis-mock";
import type Redis from "ioredis";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setRedisForTests } from "@/server/redis";
import { clearInflightForTests } from "@/server/session/refresh";
import { COOKIE } from "@/server/session/cookies";
import { signUser } from "@/server/session/sign";
import { cookieStore, fakeJwt, jar, resetNextHeaders } from "@/test/next-headers";
import { applyTestEnv } from "@/test/server-env";

applyTestEnv();
let calls: Array<{ url: string; init: { method: string; headers: HeadersInit; body?: unknown } }> = [];
let responder: (url: string, init: { method: string; headers: HeadersInit; body?: unknown }) => Response = () => new Response("{}", { status: 200 });
vi.mock("@/server/http/internal-fetch", () => ({
  internalFetch: async (url: string, init: { method: string; headers: HeadersInit; body?: unknown }) => { calls.push({ url, init }); return responder(url, init); },
}));

const ctx = { params: Promise.resolve({}) };
const nowS = () => Math.floor(Date.now() / 1000);
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const post = (path: string, body: unknown) =>
  new NextRequest(`https://archibi.ca${path}`, { method: "POST", headers: { "content-type": "application/json", origin: "https://archibi.ca" }, body: JSON.stringify(body) });
const pair = () => ({ access: fakeJwt(nowS() + 900), access_exp: Date.now() + 9e5, refresh: fakeJwt(nowS() + 86400 * 14), refresh_exp: Date.now() + 14 * 864e5 });
const me = { username: "a@b.c", email: "a@b.c", uuid: "u1", imageUri: null };
const sessionCookies = () => {
  jar.set(COOKIE.access, { value: fakeJwt(nowS() + 600) });
  jar.set(COOKIE.refresh, { value: fakeJwt(nowS() + 86400) });
  jar.set(COOKIE.user, { value: signUser({ uuid: "u1", username: "a@b.c", email: "a@b.c", imageUri: "" }) });
};
const path = (i: number) => new URL(calls[i]!.url).pathname.replace("/api/web/v1/", "");
const header = (i: number, name: string) => new Headers(calls[i]!.init.headers).get(name);

beforeEach(async () => {
  resetNextHeaders();
  clearInflightForTests();
  calls = [];
  const mock = new RedisMock();
  await mock.flushall();
  setRedisForTests(mock as unknown as Redis);
});

describe("BFF auth routes", () => {
  it("login: A1 (form: username/password) then A7 with the fresh token; cookies set; no token in the body", async () => {
    const tokens = pair();
    responder = (url) => (url.includes("user/login/")
      ? json({ message: "User logged in Successfully", uuid: "u1", membership: "FREE", imageUri: null, ...tokens }, 202)
      : json(me));
    const { POST } = await import("./auth/login/route");
    const res = await POST(post("/bff/auth/login", { email: "a@b.c", password: "Str0ng-pass!" }), ctx);
    expect(res.status).toBe(200);
    expect(calls.map((_, i) => path(i))).toEqual(["user/login/", "user/get-details/"]);
    expect(calls[0]!.init.body).toBe("username=a%40b.c&password=Str0ng-pass%21");
    expect(header(1, "Authorization")).toBe(`Bearer ${tokens.access}`);
    expect(header(1, "user-uuid")).toBe("u1");
    expect([...jar.keys()].sort()).toEqual([COOKIE.access, COOKIE.refresh, COOKIE.user].sort());
    const text = await res.text();
    expect(text).not.toContain(tokens.access);
    expect(JSON.parse(text)).toEqual({ user: { uuid: "u1", username: "a@b.c", email: "a@b.c", imageUri: "" }, accountRestored: false });
  });

  it("login: wrong password → 400 PASSWORD_IS_NOT_VALID, no cookies", async () => {
    responder = () => json({ message: "Access denied: wrong password." }, 400);
    const { POST } = await import("./auth/login/route");
    const res = await POST(post("/bff/auth/login", { email: "a@b.c", password: "x" }), ctx);
    expect([res.status, (await res.json()).error.code]).toEqual([400, "PASSWORD_IS_NOT_VALID"]);
    expect(jar.size).toBe(0);
  });

  it("login: accountRestored is passed through", async () => {
    responder = (url) => (url.includes("user/login/") ? json({ message: "User logged in Successfully", uuid: "u1", accountRestored: true, ...pair() }, 202) : json(me));
    const { POST } = await import("./auth/login/route");
    expect((await (await POST(post("/bff/auth/login", { email: "a@b.c", password: "x" }), ctx)).json()).accountRestored).toBe(true);
  });

  it("signup: A2 only, no session", async () => {
    responder = () => json({ message: "verification email has sent successfully." }, 201);
    const { POST } = await import("./auth/signup/route");
    const res = await POST(post("/bff/auth/signup", { email: "n@b.co", password: "Str0ng-pass!" }), ctx);
    expect(res.status).toBe(200);
    expect(path(0)).toBe("user/register/onstep/");
    expect(calls[0]!.init.body).toBe("email=n%40b.co&password=Str0ng-pass%21");
    expect(jar.size).toBe(0);
  });

  it("signup: weak password is rejected before Django is called", async () => {
    const { POST } = await import("./auth/signup/route");
    const res = await POST(post("/bff/auth/signup", { email: "n@b.co", password: "short" }), ctx);
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("verify: A3 with verification_code, session from the response (no A7)", async () => {
    responder = () => json({ message: "Registered successfully!", uuid: "u1", username: "n@b.co", email: "n@b.co", membership: "FREE", imageUri: "", ...pair() });
    const { POST } = await import("./auth/verify/route");
    const res = await POST(post("/bff/auth/verify", { email: "n@b.co", code: "123456" }), ctx);
    expect(res.status).toBe(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.init.body).toBe("email=n%40b.co&verification_code=123456");
    expect(jar.has(COOKIE.refresh)).toBe(true);
  });

  it("google / apple: id_token form field, session from the body", async () => {
    responder = () => json({ message: "User logged in Successfully", uuid: "u9", username: "g@x.c", email: "g@x.c", imageUri: null, ...pair() }, 202);
    const google = await import("./auth/google/route");
    expect((await google.POST(post("/bff/auth/google", { credential: "g".repeat(30) }), ctx)).status).toBe(200);
    expect(path(0)).toBe("google_auth/");
    expect(calls[0]!.init.body).toBe(`id_token=${"g".repeat(30)}`);
    resetNextHeaders();
    calls = [];
    const apple = await import("./auth/apple/route");
    expect((await apple.POST(post("/bff/auth/apple", { idToken: "a".repeat(30) }), ctx)).status).toBe(200);
    expect(path(0)).toBe("apple_auth/");
  });

  it("forgot-password: A4, forwards the client IP for the 5/hour throttle", async () => {
    responder = () => json({ message: "We Sent an Email to Your Email!" });
    const { POST } = await import("./auth/forgot-password/route");
    const { incoming } = await import("@/test/next-headers");
    incoming.set("x-forwarded-for", "203.0.113.7");
    const res = await POST(post("/bff/auth/forgot-password", { email: "a@b.co" }), ctx);
    expect(res.status).toBe(200);
    expect(header(0, "X-Forwarded-For")).toBe("203.0.113.7");
  });

  it("logout: A9 with the refresh cookie, then cookies cleared — even when Django fails", async () => {
    sessionCookies();
    const refresh = jar.get(COOKIE.refresh)!.value;
    responder = () => json({}, 500);
    const { POST } = await import("./session/logout/route");
    const res = await POST(post("/bff/session/logout", {}), ctx);
    expect(res.status).toBe(204);
    expect(path(0)).toBe("user/logout/");
    expect(calls[0]!.init.body).toBe(JSON.stringify({ refresh }));
    expect(header(0, "Authorization")).toBeNull();
    expect(jar.size).toBe(0);
  });

  it("session boot: a deleted account is signed out; a transient failure keeps the session", async () => {
    sessionCookies();
    const { GET } = await import("./session/route");
    const get = () => GET(new NextRequest("https://archibi.ca/bff/session?boot=1"), ctx);

    responder = (url) => (url.includes("check-validation") ? json({ hasDeletedAccount: true, newUsername: "a@b.c" }) : json({}));
    expect(await (await get()).json()).toEqual({ authenticated: false, reason: "account_removed" });
    expect(jar.size).toBe(0);

    sessionCookies();
    calls = [];
    responder = () => json({}, 503);
    const kept = await (await get()).json();
    expect(kept.authenticated).toBe(true);
    expect(jar.has(COOKIE.refresh)).toBe(true);
  });

  it("session boot: refreshes the user (new avatar/name) into ab_u", async () => {
    sessionCookies();
    responder = (url) => (url.includes("check-validation") ? json({ hasDeletedAccount: false, newUsername: "a@b.c" }) : json({ ...me, username: "renamed", imageUri: "https://x/y.png" }));
    const { GET } = await import("./session/route");
    const body = await (await GET(new NextRequest("https://archibi.ca/bff/session?boot=1"), ctx)).json();
    expect(body.user).toMatchObject({ username: "renamed", imageUri: "https://x/y.png" });
    expect(path(0)).toBe("check-validation/");
    expect(path(1)).toBe("user/get-details/");
  });

  it("session without ?boot makes no Django call while the access token is fresh", async () => {
    sessionCookies();
    const { GET } = await import("./session/route");
    const body = await (await GET(new NextRequest("https://archibi.ca/bff/session"), ctx)).json();
    expect(body.authenticated).toBe(true);
    expect(calls).toHaveLength(0);
  });
});

describe("BFF account routes", () => {
  it("projects/transactions/favorites send page and the right Django paths (type=all like the app)", async () => {
    sessionCookies();
    responder = () => json({ generatedImages: [], transactions: [], posts: [] });
    for (const [mod, expected] of [["./account/projects/route", "user/ai/gallery/"], ["./account/transactions/route", "account/transactions/"], ["./ideabank/favorites/route", "ai/gallery/favorites/"]] as const) {
      calls = [];
      const { GET } = await import(mod);
      const res = await GET(new NextRequest("https://archibi.ca/bff/x?page=3"), ctx);
      expect(res.status).toBe(200);
      expect(path(0)).toBe(expected);
      const url = new URL(calls[0]!.url);
      expect(url.searchParams.get("page")).toBe("3");
      if (expected === "user/ai/gallery/") expect(url.searchParams.get("type")).toBe("all");
    }
  });

  it("INVALID_PAGE from Django reaches the browser as the end-of-list signal", async () => {
    sessionCookies();
    responder = () => json({ detail: "Invalid page." }, 404);
    const { GET } = await import("./account/transactions/route");
    const res = await GET(new NextRequest("https://archibi.ca/bff/account/transactions?page=9"), ctx);
    expect([res.status, (await res.json()).error.code]).toEqual([404, "INVALID_PAGE"]);
  });

  it("change-password: form fields named exactly like the app's", async () => {
    sessionCookies();
    responder = () => json({ message: "Password has been changed successfully." });
    const { POST } = await import("./account/change-password/route");
    const res = await POST(post("/bff/account/change-password", { old_password: "oldpass12", new_password: "N3w-pass!word", confirm_password: "N3w-pass!word" }), ctx);
    expect(res.status).toBe(200);
    expect(calls[0]!.init.body).toBe("old_password=oldpass12&new_password=N3w-pass%21word&confirm_password=N3w-pass%21word");
  });

  it("delete: JSON {confirmation}; session cookies are cleared after the 202", async () => {
    sessionCookies();
    responder = () => json({ message: "Your account is scheduled for deletion.", deletionScheduledFor: "2026-11-26T00:00:00Z" }, 202);
    const { POST } = await import("./account/delete/route");
    const res = await POST(post("/bff/account/delete", { confirmation: "DELETE" }), ctx);
    expect(res.status).toBe(200);
    expect(calls[0]!.init.body).toBe('{"confirmation":"DELETE"}');
    expect(jar.size).toBe(0);
  });

  it("profile: sends username only when non-blank and the picture only when present; rewrites ab_u", async () => {
    sessionCookies();
    responder = () => json({ message: "the profile has been changed successfully!", updatedUserData: { username: "newname", imageUri: "https://x/p.png", isAdmin: false } });
    const { PUT } = await import("./account/profile/route");
    const form = new FormData();
    form.set("username", "  newname ");
    form.set("profilePicture", new File([new Uint8Array([137, 80, 78, 71])], "profile.png", { type: "image/png" }));
    const req = new NextRequest("https://archibi.ca/bff/account/profile", { method: "PUT", headers: { origin: "https://archibi.ca" }, body: form });
    const res = await PUT(req, ctx);
    expect(res.status).toBe(200);
    const sent = calls[0]!.init.body as FormData;
    expect(sent.get("username")).toBe("newname");
    expect((sent.get("profilePicture") as File).type).toBe("image/png");
    expect(calls[0]!.init.method).toBe("PUT");
    expect((await res.json()).user).toMatchObject({ username: "newname", imageUri: "https://x/p.png", email: "a@b.c" });
    const { verifyUser } = await import("@/server/session/sign");
    expect(verifyUser(jar.get(COOKIE.user)!.value)).toMatchObject({ username: "newname", imageUri: "https://x/p.png" });
  });

  it("profile: blank username and no picture sends nothing for them; non-image files are refused", async () => {
    sessionCookies();
    responder = () => json({ message: "ok", updatedUserData: { username: "a@b.c" } });
    const { PUT } = await import("./account/profile/route");
    const blank = new FormData();
    blank.set("username", "   ");
    await PUT(new NextRequest("https://archibi.ca/bff/account/profile", { method: "PUT", headers: { origin: "https://archibi.ca" }, body: blank }), ctx);
    const sent = calls[0]!.init.body as FormData;
    expect([sent.has("username"), sent.has("profilePicture")]).toEqual([false, false]);

    calls = [];
    const bad = new FormData();
    bad.set("profilePicture", new File(["x"], "evil.html", { type: "text/html" }));
    const res = await PUT(new NextRequest("https://archibi.ca/bff/account/profile", { method: "PUT", headers: { origin: "https://archibi.ca" }, body: bad }), ctx);
    expect(res.status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it("billing: cancel posts {} ; manage-url picks apple/google; credits reads user/ai/credits/", async () => {
    sessionCookies();
    responder = () => json({ message: "success", manageUrl: "https://store", ai_credits: 4 });
    const cancel = await import("./billing/subscription/cancel/route");
    await cancel.POST(post("/bff/billing/subscription/cancel", {}), ctx);
    expect([path(0), calls[0]!.init.body]).toEqual(["premium/subscriptions/stripe/cancel/", "{}"]);
    calls = [];
    const manage = await import("./billing/subscription/manage-url/route");
    await manage.GET(new NextRequest("https://archibi.ca/bff/billing/subscription/manage-url?provider=google"), ctx);
    expect(path(0)).toBe("premium/subscriptions/google/manage/");
    const bad = await manage.GET(new NextRequest("https://archibi.ca/bff/billing/subscription/manage-url?provider=evil"), ctx);
    expect(bad.status).toBe(400);
    calls = [];
    const credits = await import("./ai/credits/route");
    expect((await credits.GET(new NextRequest("https://archibi.ca/bff/ai/credits"), ctx)).status).toBe(200);
    expect(path(0)).toBe("user/ai/credits/");
  });

  it("an unauthenticated browser gets 401 UNAUTHORIZED and no Django call", async () => {
    const { GET } = await import("./account/projects/route");
    const res = await GET(new NextRequest("https://archibi.ca/bff/account/projects?page=1"), ctx);
    expect([res.status, (await res.json()).error.code]).toEqual([401, "UNAUTHORIZED"]);
    expect(calls).toHaveLength(0);
  });
});

void cookieStore;
