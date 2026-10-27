import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { ZodType } from "zod";
import { env } from "@/server/env";
import { routeHandlerWriter, type SessionWriter } from "@/server/session/cookies";
import { AppError, toErrorBody } from "@/shared/errors/app-error";

export interface BffContext<P> { req: NextRequest; params: P; session: SessionWriter }
interface Options<I> { input?: ZodType<I>; inputFrom?: "json" | "query" | "form"; mutating?: boolean }

const noStore = (r: NextResponse) => {
  r.headers.set("Cache-Control", "no-store");
  return r;
};

export function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get("origin");
  const devLocal = env().NODE_ENV !== "production" && origin?.startsWith("http://localhost");
  if (origin !== env().PUBLIC_ORIGIN && !devLocal) throw new AppError("FORBIDDEN", 403, "cross-origin request");
}

async function readInput(req: NextRequest, from: "json" | "query" | "form"): Promise<unknown> {
  if (from === "query") return Object.fromEntries(req.nextUrl.searchParams);
  if (from === "form") return req.formData();
  const text = await req.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("UNKNOWN", 400, "Invalid JSON body");
  }
}

/** One wrapper for every /bff/* route (F08): same-origin on mutations, zod input, no-store, error envelope. */
export function bffHandler<I, O, P = Record<string, string>>(
  opts: Options<I>,
  fn: (input: I, ctx: BffContext<P>) => Promise<O | NextResponse>,
) {
  return async (req: NextRequest, context: { params: Promise<P> }): Promise<NextResponse> => {
    try {
      if (opts.mutating ?? req.method !== "GET") assertSameOrigin(req);
      const session = await routeHandlerWriter();
      const raw = await readInput(req, opts.inputFrom ?? (req.method === "GET" ? "query" : "json"));
      const input = opts.input ? opts.input.parse(raw) : (raw as I);
      const out = await fn(input, { req, params: await context.params, session });
      if (out instanceof NextResponse) return noStore(out);
      if (out === undefined || out === null) return noStore(new NextResponse(null, { status: 204 }));
      return noStore(NextResponse.json(out));
    } catch (e) {
      const err = AppError.from(e);
      if (err.status >= 500) console.error(JSON.stringify({ level: "error", src: "bff", path: req.nextUrl.pathname, code: err.code }));
      return noStore(NextResponse.json(toErrorBody(err), { status: err.status }));
    }
  };
}
