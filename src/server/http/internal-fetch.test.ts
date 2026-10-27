// @vitest-environment node
import { createServer, type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { internalFetch } from "./internal-fetch";

/** Regression test for the Phase 1 live failure: the Host header must reach the server. */
let seen: IncomingHttpHeaders = {};
let seenBody = "";
const server = createServer((req, res) => {
  seen = req.headers;
  let b = "";
  req.on("data", (c) => (b += c));
  req.on("end", () => {
    seenBody = b;
    res.writeHead(201, { "content-type": "application/json", "set-cookie": ["a=1", "b=2"] });
    res.end(JSON.stringify({ ok: true }));
  });
});
let url = "";
beforeAll(async () => {
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/web/v1/x/`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

describe("internalFetch", () => {
  it("sends an explicit Host header (Node fetch would drop it)", async () => {
    await internalFetch(url, { method: "GET", headers: { Host: "api.uritect.com" } });
    expect(seen.host).toBe("api.uritect.com");
  });

  it("returns a standard Response with status, body and multi-value headers", async () => {
    const res = await internalFetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"a":1}' });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.getSetCookie()).toEqual(["a=1", "b=2"]);
    expect(seenBody).toBe('{"a":1}');
  });

  it("encodes FormData as multipart", async () => {
    const form = new FormData();
    form.set("designType", "Interior");
    await internalFetch(url, { method: "POST", headers: {}, body: form });
    expect(String(seen["content-type"])).toMatch(/^multipart\/form-data; boundary=/);
    expect(seenBody).toContain('name="designType"');
  });
});
