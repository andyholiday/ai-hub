// =============================================================================
// Admin Auth Helper
// Verifies that the current request is from an authenticated admin user.
// Reusable across all /api/admin/* route handlers.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminAuthResult {
  /** The authenticated user's ID */
  userId: string;
  /** The user's role */
  role: "admin" | "super_admin";
}

export interface AdminAuthError {
  response: NextResponse;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Validate that the incoming request belongs to an admin or super_admin.
 *
 * Returns either the authenticated context or a pre-built error response.
 * Usage in route handlers:
 *
 * ```ts
 * const auth = await requireAdmin(req);
 * if ("response" in auth) return auth.response;
 * const { userId, role } = auth;
 * ```
 */
export async function requireAdmin(
  req: NextRequest,
): Promise<AdminAuthResult | AdminAuthError> {
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

  // --- Check admin role ---
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;

  if (!role || (role !== "admin" && role !== "super_admin")) {
    return {
      response: NextResponse.json(
        {
          data: null,
          error: {
            code: "FORBIDDEN",
            message: "Admin privileges required",
          },
        },
        { status: 403 },
      ),
    };
  }

  return {
    userId: user.id,
    role: role as "admin" | "super_admin",
  };
}
