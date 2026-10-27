// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyTestEnv } from "@/test/server-env";
import { fakeJwt } from "@/test/next-headers";

applyTestEnv();
const singleFlight = vi.fn();
vi.mock("@/server/session/refresh", async (orig) => ({ ...(await orig<object>()), singleFlight: (r: string) => singleFlight(r) }));

const { proxy } = await import("./proxy");
const { signUser } = await import("@/server/session/sign");
const nowS = () => Math.floor(Date.now() / 1000);
const user = { uuid: "u", username: "a", email: "a@b.c", imageUri: "" };

function request(path: string, cookies: Record<string, string> = {}) {
  const r = new NextRequest(`https://archibi.ca${path}`);
  for (const [k, v] of Object.entries(cookies)) r.cookies.set(k, v);
  return r;
}
const session = (accessExpS: number) => ({ ab_at: fakeJwt(accessExpS), ab_rt: "rt", ab_u: signUser(user) });

describe("proxy (F07)", () => {
  beforeEach(() => singleFlight.mockReset());

  it("P1 protected page without session → login with next", async () => {
    const res = await proxy(request("/account"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://archibi.ca/auth/login?next=%2Faccount");
  });

  it("P2 public page without session → pass through", async () => {
    const res = await proxy(request("/ideabank"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("P3 auth page with session → next or /ideabank", async () => {
    expect((await proxy(request("/auth/login", session(nowS() + 600)))).headers.get("location")).toBe("https://archibi.ca/ideabank");
    const withNext = await proxy(request("/auth/login?next=%2Fhiring%2Fwishlist", session(nowS() + 600)));
    expect(withNext.headers.get("location")).toBe("https://archibi.ca/hiring/wishlist");
  });

  it("P4 open-redirect guard", async () => {
    const res = await proxy(request("/auth/login?next=https%3A%2F%2Fevil.com", session(nowS() + 600)));
    expect(res.headers.get("location")).toBe("https://archibi.ca/ideabank");
  });

  it("P5 expired access on a protected page → one refresh, cookies set, x-ab-at forwarded", async () => {
    const fresh = fakeJwt(nowS() + 900);
    singleFlight.mockResolvedValueOnce({ access: fresh, access_exp: Date.now() + 9e5, refresh: "rt2", refresh_exp: Date.now() + 1e9 });
    const res = await proxy(request("/account", session(nowS() - 10)));
    expect(singleFlight).toHaveBeenCalledWith("rt");
    expect(res.cookies.get("ab_at")?.value).toBe(fresh);
    expect(res.cookies.get("ab_rt")?.value).toBe("rt2");
    expect(res.headers.get("x-middleware-request-x-ab-at")).toBe(fresh);
  });

  it("P6 refresh failure on a protected page → login + cookies cleared", async () => {
    singleFlight.mockRejectedValueOnce(new Error("401"));
    const res = await proxy(request("/account", session(nowS() - 10)));
    expect(res.headers.get("location")).toContain("/auth/login");
    expect(res.cookies.get("ab_rt")?.value).toBe("");
  });

  it("P7 refresh failure on a public page → continue anonymous, cookies cleared", async () => {
    singleFlight.mockRejectedValueOnce(new Error("401"));
    const res = await proxy(request("/hiring", session(nowS() - 10)));
    expect(res.headers.get("location")).toBeNull();
    expect(res.cookies.get("ab_at")?.value).toBe("");
  });

  it("P8 matcher excludes /bff, /_next and WordPress paths", async () => {
    const { config } = await import("./proxy");
    const re = (m: string) => new RegExp(`^${m.replace("/:path*", "(/.*)?")}$`);
    const matches = (p: string) => config.matcher.some((m) => re(m).test(p));
    expect(matches("/bff/session")).toBe(false);
    expect(matches("/_next/static/x.js")).toBe(false);
    expect(matches("/pricing")).toBe(false);
    expect(matches("/account/edit")).toBe(true);
  });

  it("valid access → no refresh", async () => {
    await proxy(request("/account", session(nowS() + 600)));
    expect(singleFlight).not.toHaveBeenCalled();
  });
});
