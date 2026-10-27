import { NextResponse, type NextRequest } from "next/server";
import { toSessionUser } from "@/features/auth/model/user";
import { verifyAppleToken } from "@/features/auth/server/repository";
import { env } from "@/server/env";
import { routeHandlerWriter, writeSession } from "@/server/session/cookies";
import { routes, safeNext } from "@/shared/config/routes";

/**
 * Sign in with Apple, redirect (form_post) flow — the fallback when the popup is blocked.
 * Apple POSTs from its own origin, so the same-origin check is intentionally not applied; the
 * id_token is the proof and Django verifies it (aud = WEB_APPLE_CLIENT_ID). `state` carries `next`.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const origin = env().PUBLIC_ORIGIN;
  const form = await req.formData();
  const idToken = String(form.get("id_token") ?? "");
  let next: string | null = null;
  try {
    next = (JSON.parse(Buffer.from(String(form.get("state") ?? ""), "base64url").toString("utf8")) as { next?: string }).next ?? null;
  } catch {
    next = null;
  }
  try {
    const res = await verifyAppleToken(idToken);
    writeSession(await routeHandlerWriter(), res, toSessionUser(res));
    return NextResponse.redirect(new URL(safeNext(next), origin), 303);
  } catch {
    return NextResponse.redirect(new URL(`${routes.auth.login()}?error=apple`, origin), 303);
  }
}
