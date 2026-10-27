import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isDownloadableHost } from "@/shared/share/download-hosts";
import { downloadName } from "@/shared/share/share-links";

const MAX_BYTES = 25 * 1024 * 1024;
const Query = z.object({ url: z.string().url().max(2048), name: z.string().max(100).optional() });
const fail = (status: number, message: string) => NextResponse.json({ error: { code: "UNKNOWN", message } }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Same-origin proxy so "Download" saves the picture instantly: browsers can't read S3/CDN images cross-origin
 * (no CORS), so the server fetches it and answers with Content-Disposition: attachment. Allowlisted hosts only.
 */
export async function GET(req: NextRequest) {
  if (req.headers.get("sec-fetch-site") && !["same-origin", "none"].includes(req.headers.get("sec-fetch-site")!)) return fail(403, "cross-origin request");
  const parsed = Query.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return fail(400, "Invalid download request");
  const target = new URL(parsed.data.url);
  if (!/^https?:$/.test(target.protocol) || !isDownloadableHost(target.hostname)) return fail(400, "This image can't be downloaded.");

  let upstream: Response;
  try {
    upstream = await fetch(target, { redirect: "error", signal: AbortSignal.timeout(20_000) });
  } catch {
    return fail(502, "Couldn't fetch the image.");
  }
  const type = upstream.headers.get("content-type") ?? "";
  const length = Number(upstream.headers.get("content-length") ?? 0);
  if (!upstream.ok || !type.startsWith("image/")) return fail(502, "Couldn't fetch the image.");
  if (length > MAX_BYTES) return fail(413, "Image is too large.");
  const bytes = await upstream.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) return fail(413, "Image is too large.");

  const name = downloadName(parsed.data.name ?? "", target.pathname, type);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": type,
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
