// =============================================================================
// Next.js Middleware
// Auth protection, session refresh, route guards
//
// SECURITY: Uses getUser() to validate the session server-side via an Auth API
// call on every matched request. This ensures the JWT has not been revoked.
//
// Admin role check uses JWT app_metadata instead of a DB query.
// =============================================================================

import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import type { User } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Route Definitions
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/callback"];
const ADMIN_ROUTES = ["/admin", "/api/admin"];

// Cookie names that may hold a corrupted Supabase session.
// `.0`/`.1` are the chunk suffixes @supabase/ssr uses when a token exceeds the
// 4 KiB cookie size limit. Clearing all three is enough for any project ref.
const SUPABASE_COOKIE_SUFFIXES = ["", ".0", ".1"];

function clearSupabaseCookies(request: NextRequest, response: NextResponse): void {
  // Use explicit max-age=0 + value="" so a Set-Cookie header is always emitted,
  // even when the response was created via NextResponse.redirect / NextResponse.json
  // (which don't carry incoming request cookies through to response.cookies.delete).
  const expire = { path: "/", maxAge: 0, value: "" } as const;
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
      response.cookies.set({ name: cookie.name, ...expire });
      for (const suffix of SUPABASE_COOKIE_SUFFIXES) {
        if (!suffix) continue;
        response.cookies.set({ name: `${cookie.name}${suffix}`, ...expire });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const { pathname } = request.nextUrl;

  // Use getUser() - validates the JWT server-side via Auth API round-trip.
  // This ensures revoked or tampered tokens are rejected at the middleware layer.
  //
  // RESILIENCE: a corrupted auth cookie (e.g. an access_token with newlines)
  // makes @supabase/ssr throw an unhandled rejection in `Headers.append`,
  // which would otherwise return HTTP 500 on every page. Catch it, mark the
  // session as corrupted, and treat the request as anonymous; the poisoned
  // cookie is cleared on whichever response we ultimately return.
  let user: User | null = null;
  let sessionCorrupted = false;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (err) {
    console.warn(
      "[middleware] Failed to resolve Supabase session; clearing auth cookie:",
      err instanceof Error ? err.message : err,
    );
    sessionCorrupted = true;
    user = null;
  }

  // Public routes - allow access without auth
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    // API route protection - return 401 JSON instead of redirecting
    if (pathname.startsWith("/api/")) {
      const apiResponse = NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
      if (sessionCorrupted) clearSupabaseCookies(request, apiResponse);
      return apiResponse;
    }

    // Web route protection - redirect to login
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    if (sessionCorrupted) clearSupabaseCookies(request, redirectResponse);
    return redirectResponse;
  }

  if (user && isPublicRoute && pathname !== "/callback") {
    // Redirect authenticated users away from auth pages
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Admin route protection - read role from JWT app_metadata (no DB query)
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  if (isAdminRoute && user) {
    const role = user.app_metadata?.role as string | undefined;

    if (!role || !["admin", "super_admin"].includes(role)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Insufficient permissions" } },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

// ---------------------------------------------------------------------------
// Matcher Configuration
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico / favicon.svg (favicon files)
     * - logo.svg (logo file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|favicon\\.svg|logo\\.svg|images/|fonts/).*)",
  ],
};
