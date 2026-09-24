import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_REALM, checkAdminAuth } from "./lib/auth/admin";

/**
 * Runs before every /admin page and /api/admin route (see `matcher`) and
 * blocks the request unless it carries the admin password.
 */
export function proxy(request: NextRequest) {
  const result = checkAdminAuth(request.headers.get("authorization"));
  if (result === "ok") return NextResponse.next();

  const status = result === "not_configured" ? 503 : 401;
  const message =
    result === "not_configured"
      ? "The admin area is disabled. Set ADMIN_USERNAME and ADMIN_PASSWORD on the server."
      : "Authentication required.";
  // The WWW-Authenticate header is what makes the browser show a login prompt.
  const headers: Record<string, string> =
    status === 401 ? { "WWW-Authenticate": ADMIN_REALM } : {};

  // API clients get JSON like every other API error; browsers get plain text.
  return request.nextUrl.pathname.startsWith("/api/")
    ? NextResponse.json({ error: message }, { status, headers })
    : new NextResponse(message, { status, headers });
}

export const config = {
  // `:path*` also matches the bare /admin and /api/admin paths.
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
