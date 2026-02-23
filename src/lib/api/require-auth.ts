// =============================================================================
// Auth Helper for API Routes
// Verifies that the current request is from an authenticated user.
// Reusable across all API route handlers requiring authentication.
//
// OPTIMIZED:
// - Uses getSession() instead of getUser() to avoid Auth API round-trip.
//   The JWT is cryptographically signed; local validation is sufficient.
// - Reads user role from JWT app_metadata instead of a separate DB query.
//   This eliminates 2 queries per API call (getUser + profile role fetch).
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuthResult {
  /** The authenticated user's ID */
  userId: string;
  /** The user's role (read from JWT app_metadata) */
  role: "user" | "moderator" | "admin" | "super_admin";
  /** The Supabase client scoped to this request (respects RLS) */
  supabase: ReturnType<typeof createServerClient<Database>>;
}

export interface AuthError {
  response: NextResponse;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Validate that the incoming request belongs to an authenticated user.
 *
 * Returns either the authenticated context or a pre-built error response.
 * Usage in route handlers:
 *
 * ```ts
 * const auth = await requireAuth(req);
 * if ("response" in auth) return auth.response;
 * const { userId, role, supabase } = auth;
 * ```
 */
export async function requireAuth(
  req: NextRequest,
): Promise<AuthResult | AuthError> {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    },
  );

  // --- Validate session from JWT (no Auth API round-trip) ---
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return {
      response: NextResponse.json(
        {
          data: null,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 },
      ),
    };
  }

  const user = session.user;

  // --- Read role from JWT app_metadata (no DB query) ---
  const role = (user.app_metadata?.role ?? "user") as AuthResult["role"];

  return {
    userId: user.id,
    role,
    supabase,
  };
}
