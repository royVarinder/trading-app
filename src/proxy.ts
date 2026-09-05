import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, ADMIN_SESSION_COOKIE_NAME } from "@/lib/constants";

const AUTH_PATHS = new Set(["/login", "/signup"]);

export function proxy(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  const { pathname } = req.nextUrl;

  if (pathname === "/" && !hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (AUTH_PATHS.has(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/", req.url));
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
  matcher: ["/", "/login", "/signup", "/admin/:path*"],
};
