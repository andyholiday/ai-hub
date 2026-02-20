// =============================================================================
// Auth Helper for API Routes
// Verifies that the current request is from an authenticated user.
// Reusable across all API route handlers requiring authentication.
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
  /** The user's role */
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

  // --- Verify user with auth server (getUser validates the JWT) ---
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
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

  // --- Fetch role ---
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = ((profile as { role: string } | null)?.role ?? "user") as AuthResult["role"];

  return {
    userId: user.id,
    role,
    supabase,
  };
}
