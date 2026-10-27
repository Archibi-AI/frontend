// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { applyTestEnv } from "@/test/server-env";
import { fakeJwt, incoming, jar, resetNextHeaders, cookieStore } from "@/test/next-headers";
import { clearSession, COOKIE, FRESH_ACCESS_HEADER, getSessionTokens, writeSession } from "./cookies";
import { signUser, verifyUser } from "./sign";

applyTestEnv();
const user = { uuid: "5c1", username: "a@b.c", email: "a@b.c", imageUri: "" };
const writer = { set: cookieStore.set, delete: cookieStore.delete };

describe("ab_u signing (F05)", () => {
  it("round trips", () => expect(verifyUser(signUser(user))).toEqual(user));
  it("rejects a tampered payload", () => {
    const [, sig] = signUser(user).split(".");
    const forged = Buffer.from(JSON.stringify({ ...user, uuid: "other" })).toString("base64url");
    expect(verifyUser(`${forged}.${sig}`)).toBeNull();
  });
  it("rejects a tampered signature", () => expect(verifyUser(`${signUser(user).split(".")[0]}.AAAA`)).toBeNull());
  it("rejects garbage", () => expect(verifyUser("not-a-cookie")).toBeNull());
});

describe("session cookies (F05)", () => {
  beforeEach(resetNextHeaders);

  it("writeSession sets three httpOnly/lax/path=/ cookies with maxAge from exp", () => {
    const now = Date.now();
    writeSession(writer, { access: "a", access_exp: now + 900_000, refresh: "r", refresh_exp: now + 14 * 864e5 }, user);
    expect([...jar.keys()].sort()).toEqual([COOKIE.access, COOKIE.user, COOKIE.refresh].sort());
    const at = jar.get(COOKIE.access)!.opts as { maxAge: number };
    expect(at).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
    expect(Math.abs(at.maxAge - 900)).toBeLessThanOrEqual(1);
  });

  it("Secure follows the origin scheme: on for https, off for the local http stack", async () => {
    const { resetEnvForTests } = await import("@/server/env");
    const write = () => {
      jar.clear();
      writeSession(writer, { access: "a", access_exp: Date.now() + 9e5, refresh: "r", refresh_exp: Date.now() + 9e8 }, user);
      return (jar.get(COOKIE.refresh)!.opts as { secure: boolean }).secure;
    };
    const saved = { NODE_ENV: process.env.NODE_ENV, PUBLIC_ORIGIN: process.env.PUBLIC_ORIGIN };
    try {
      (process.env as Record<string, string>).NODE_ENV = "production";
      process.env.PUBLIC_ORIGIN = "https://archibi.ca";
      resetEnvForTests();
      expect(write()).toBe(true);
      process.env.PUBLIC_ORIGIN = "http://localhost:3100";
      resetEnvForTests();
      expect(write()).toBe(false);
    } finally {
      (process.env as Record<string, string>).NODE_ENV = saved.NODE_ENV!;
      process.env.PUBLIC_ORIGIN = saved.PUBLIC_ORIGIN!;
      resetEnvForTests();
    }
  });

  it("clearSession deletes all three", () => {
    writeSession(writer, { access: "a", access_exp: Date.now() + 1e6, refresh: "r", refresh_exp: Date.now() + 1e7 }, user);
    clearSession(writer);
    expect(jar.size).toBe(0);
  });

  it("getSessionTokens prefers the proxy-forwarded access token", async () => {
    const cookieAccess = fakeJwt(1), freshAccess = fakeJwt(2_000_000_000);
    jar.set(COOKIE.access, { value: cookieAccess });
    jar.set(COOKIE.refresh, { value: "r" });
    jar.set(COOKIE.user, { value: signUser(user) });
    incoming.set(FRESH_ACCESS_HEADER, freshAccess);
    const s = await getSessionTokens();
    expect(s.access).toBe(freshAccess);
    expect(s.accessExp).toBe(2_000_000_000_000);
    expect(s.user).toEqual(user);
  });
});
