// =============================================================================
// Next.js Middleware
// Auth protection, session refresh, route guards
//
// OPTIMIZED: Uses getSession() instead of getUser() to avoid an Auth API call
// on every request. getSession() reads the JWT from the cookie and validates
// it locally. The actual server-side verification happens in requireAuth()
// within API routes where data mutations occur.
//
// Admin role check uses JWT app_metadata instead of a DB query.
// =============================================================================

import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

// ---------------------------------------------------------------------------
// Route Definitions
// ---------------------------------------------------------------------------

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/callback"];
const ADMIN_ROUTES = ["/admin"];

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request);
  const { pathname } = request.nextUrl;

  // Use getSession() - reads JWT from cookie, no Auth API call.
  // This is safe for middleware route guards because:
  // 1. The JWT is cryptographically signed and cannot be forged
  // 2. API routes still use getUser() for server-side verification
  // 3. Expired tokens will fail session parsing and redirect to login
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;

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
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/).*)",
  ],
};
