import { NextResponse, type NextRequest } from "next/server";
import { isOwnedPath, isProtectedPath, routes, safeNext } from "@/shared/config/routes";
import { clearSession, COOKIE, cookieOptions, FRESH_ACCESS_HEADER, responseWriter } from "@/server/session/cookies";
import { jwtExpMs } from "@/server/session/jwt";
import { SKEW_MS, singleFlight } from "@/server/session/refresh";
import { verifyUser } from "@/server/session/sign";

const AUTH_PAGES = new Set(["/auth/login", "/auth/signup", "/auth/signup/verify", "/auth/forgot-password"]);

/** F07: route guards + silent refresh before render (Next 16 `proxy` convention, Node runtime). */
export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  if (!isOwnedPath(pathname)) return NextResponse.next();

  const access = req.cookies.get(COOKIE.access)?.value;
  const refresh = req.cookies.get(COOKIE.refresh)?.value;
  const user = verifyUser(req.cookies.get(COOKIE.user)?.value);
  const hasSession = Boolean(refresh && user);

  if (AUTH_PAGES.has(pathname) && hasSession) {
    return NextResponse.redirect(new URL(safeNext(req.nextUrl.searchParams.get("next")), req.url));
  }
  if (isProtectedPath(pathname) && !hasSession) {
    return NextResponse.redirect(new URL(routes.auth.login(pathname + search), req.url));
  }
  if (!hasSession || jwtExpMs(access) - Date.now() > SKEW_MS) return NextResponse.next();

  try {
    const pair = await singleFlight(refresh as string);
    const forwarded = new Headers(req.headers);
    forwarded.set(FRESH_ACCESS_HEADER, pair.access);
    const res = NextResponse.next({ request: { headers: forwarded } });
    const w = responseWriter(res);
    w.set(COOKIE.access, pair.access, cookieOptions(pair.access_exp));
    w.set(COOKIE.refresh, pair.refresh, cookieOptions(pair.refresh_exp));
    return res;
  } catch {
    const res = isProtectedPath(pathname)
      ? NextResponse.redirect(new URL(routes.auth.login(pathname + search), req.url))
      : NextResponse.next();
    clearSession(responseWriter(res));
    return res;
  }
}

export const config = {
  matcher: ["/ideabank/:path*", "/hiring/:path*", "/ai/:path*", "/account/:path*", "/billing/:path*", "/auth/:path*"],
};
