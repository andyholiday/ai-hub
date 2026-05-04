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

// ---------------------------------------------------------------------------
// Route Definitions
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/callback"];
const ADMIN_ROUTES = ["/admin", "/api/admin"];

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const { pathname } = request.nextUrl;

  // Use getUser() - validates the JWT server-side via Auth API round-trip.
  // This ensures revoked or tampered tokens are rejected at the middleware layer.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes - allow access without auth
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && !isPublicRoute) {
    // API route protection - return 401 JSON instead of redirecting
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Web route protection - redirect to login
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
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
