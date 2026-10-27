// @vitest-environment node
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { applyTestEnv } from "@/test/server-env";
import { resetNextHeaders } from "@/test/next-headers";
import { AppError } from "@/shared/errors/app-error";
import { bffHandler } from "./handler";

applyTestEnv();
const ctx = { params: Promise.resolve({}) };
const req = (method: string, body?: unknown, origin?: string, url = "https://archibi.ca/bff/x?page=2") =>
  new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", ...(origin ? { origin } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

describe("bffHandler (F08)", () => {
  beforeEach(resetNextHeaders);

  it("B1 GET success → 200 JSON with no-store, query parsed", async () => {
    const h = bffHandler({ input: z.object({ page: z.coerce.number() }) }, async ({ page }) => ({ page }));
    const res = await h(req("GET"), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ page: 2 });
  });

  it("B2 POST without Origin → 403 FORBIDDEN", async () => {
    const res = await bffHandler({}, async () => ({ ok: true }))(req("POST", {}), ctx);
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe("FORBIDDEN");
  });

  it("B3 POST from https://archibi.ca passes", async () => {
    const res = await bffHandler({}, async () => ({ ok: true }))(req("POST", {}, "https://archibi.ca"), ctx);
    expect(res.status).toBe(200);
  });

  it("B3b POST from another origin is refused", async () => {
    const res = await bffHandler({}, async () => ({ ok: true }))(req("POST", {}, "https://evil.example"), ctx);
    expect(res.status).toBe(403);
  });

  it("B4 invalid input → 400 UNKNOWN naming the field", async () => {
    const h = bffHandler({ input: z.object({ email: z.string().email() }) }, async () => ({}));
    const res = await h(req("POST", { email: "nope" }, "https://archibi.ca"), ctx);
    const body = await res.json();
    expect([res.status, body.error.code]).toEqual([400, "UNKNOWN"]);
    expect(body.error.message).toContain("email");
  });

  it("B5 AppError passes through with its status and code", async () => {
    const h = bffHandler({}, async () => { throw new AppError("OUT_OF_CREDIT", 400, "You are out of Credit!"); });
    const res = await h(req("GET"), ctx);
    expect([res.status, (await res.json()).error]).toEqual([400, { code: "OUT_OF_CREDIT", message: "You are out of Credit!" }]);
  });

  it("B6 unexpected error → 500 SERVER with a generic message (no stack)", async () => {
    const h = bffHandler({}, async () => { throw new Error("db password leaked"); });
    const res = await h(req("GET"), ctx);
    const body = await res.json();
    expect([res.status, body.error.code]).toEqual([500, "SERVER"]);
    expect(body.error.message).not.toContain("leaked");
  });

  it("returns 204 for an empty result", async () => {
    const res = await bffHandler({}, async () => undefined)(req("GET"), ctx);
    expect(res.status).toBe(204);
  });
});
