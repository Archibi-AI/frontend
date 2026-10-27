// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isDownloadableHost } from "@/shared/share/download-hosts";

afterEach(() => vi.unstubAllGlobals());
const req = (url: string, headers: Record<string, string> = {}) => new NextRequest(`https://archibi.ca/bff/download?url=${encodeURIComponent(url)}&name=Loft`, { headers });

describe("download host allowlist", () => {
  it("allows the storage/CDN hosts, refuses everything else", () => {
    expect(isDownloadableHost("bucket.s3.ca-central-1.amazonaws.com", "", false)).toBe(true);
    expect(isDownloadableHost("api.uritect.com", "", false)).toBe(true);
    expect(isDownloadableHost("evil.example", "", false)).toBe(false);
    expect(isDownloadableHost("uritect.com.evil.example", "", false)).toBe(false);
    expect(isDownloadableHost("169.254.169.254", "", false)).toBe(false);
    expect(isDownloadableHost("localhost", "", false)).toBe(false);
    expect(isDownloadableHost("localhost", "", true)).toBe(true);
    expect(isDownloadableHost("cdn.partner.io", "cdn.partner.io", false)).toBe(true);
  });
});

describe("GET /bff/download", () => {
  it("streams an allowed image as an attachment", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } })));
    const { GET } = await import("./download/route");
    const res = await GET(req("https://bucket.s3.amazonaws.com/a/loft.png?sig=1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="loft.png"');
    expect(res.headers.get("content-type")).toBe("image/png");
    expect((await res.arrayBuffer()).byteLength).toBe(3);
  });
  it("refuses hosts off the allowlist without fetching", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const { GET } = await import("./download/route");
    expect((await GET(req("https://evil.example/x.png"))).status).toBe(400);
    expect((await GET(req("http://169.254.169.254/latest/meta-data"))).status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it("refuses non-images, and cross-site requests", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { headers: { "content-type": "text/html" } })));
    const { GET } = await import("./download/route");
    expect((await GET(req("https://bucket.s3.amazonaws.com/x"))).status).toBe(502);
    expect((await GET(req("https://bucket.s3.amazonaws.com/x.png", { "sec-fetch-site": "cross-site" }))).status).toBe(403);
  });
});
