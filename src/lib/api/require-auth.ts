// =============================================================================
// Auth Helper for API Routes
// Verifies that the current request is from an authenticated user.
// Reusable across all API route handlers requiring authentication.
//
// SECURITY:
// - Uses getUser() to validate the JWT server-side via an Auth API round-trip.
//   This prevents session-spoofing via a tampered cookie.
// - Reads user role from JWT app_metadata instead of a separate DB query.
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

  // --- Validate user via Auth API (server-side JWT verification) ---
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
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

  // --- Read role from JWT app_metadata (no DB query) ---
  const role = (user.app_metadata?.role ?? "user") as AuthResult["role"];

  return {
    userId: user.id,
    role,
    supabase,
  };
}
