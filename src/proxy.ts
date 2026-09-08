import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, ADMIN_SESSION_COOKIE_NAME } from "@/lib/constants";

const AUTH_PATHS = new Set(["/login", "/signup"]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Every /api/* response is dynamic, session-scoped data (wallet
  // balances, income history, admin lists, ...). Each route.ts already
  // reads fresh from Mongo on every call, but without an explicit
  // Cache-Control header the browser was free to reuse a stale response
  // across client-side navigations (only a hard reload forced a refetch).
  // This runs before the auth checks below and returns early — every
  // /api/* route already verifies its own session/role server-side.
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, must-revalidate");
    return response;
  }

  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  // "/" is the public marketing landing page — anyone can view it.
  // Signed-in visitors are bounced straight to their dashboard instead.
  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (AUTH_PATHS.has(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Admin area — separate cookie/session from the member dashboard above.
  // This only gates page navigation on cookie *presence*, matching the
  // member-session check above; every /admin page and /api/admin/* route
  // still independently verifies the JWT + role server-side.
  if (pathname.startsWith("/admin")) {
    const hasAdminSession = Boolean(req.cookies.get(ADMIN_SESSION_COOKIE_NAME)?.value);

    if (pathname === "/admin/login") {
      if (hasAdminSession) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      return NextResponse.next();
    }

    if (!hasAdminSession) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/admin/:path*", "/api/:path*"],
};
