import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "khr_session";

const PROTECTED = ["/dashboard", "/book"] as const;
const ADMIN_PATHS = ["/admin"] as const;

/**
 * Next.js 16 "proxy.ts" — runs before routing. It only gates by cookie presence
 * to avoid server DB lookups in the proxy; real authorization is enforced by
 * server components and route handlers.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE_NAME);

  const needsAuth = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const needsAdmin = ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if ((needsAuth || needsAdmin) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/book", "/book/:path*", "/admin/:path*"],
};
