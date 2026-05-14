// =============================================================================
// Auth Helper for API Routes
// Verifies that the current request is from an authenticated user.
// Reusable across all API route handlers requiring authentication.
//
// SECURITY:
// - Uses getUser() to validate the JWT server-side via an Auth API round-trip.
//   This prevents session-spoofing via a tampered cookie.
// - ADR-016 Mismatch-Guard: DB is source of truth for role. After JWT validation
//   a lightweight DB read on profiles.role detects stale-JWT scenarios. On
//   mismatch the DB role wins; on DB error the JWT role is used as fallback.
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

  // --- ADR-016 Mismatch-Guard: DB is source of truth for role ---
  // A lightweight profiles.role read detects stale-JWT scenarios (e.g. role
  // was changed in DB but the user hasn't refreshed their token yet).
  // On mismatch: DB wins, log warning. On DB error: fall back to JWT, no 500.
  const jwtRole = (user.app_metadata?.role ?? "user") as AuthResult["role"];

  let role = jwtRole;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const dbRole = (profile as { role: string } | null)?.role as
      | AuthResult["role"]
      | undefined;

    if (dbRole !== undefined && dbRole !== jwtRole) {
      console.warn(
        `[require-auth] Role mismatch for user ${user.id}: jwt=${jwtRole} db=${dbRole} — trusting DB`,
      );
      role = dbRole;
    } else if (dbRole !== undefined) {
      role = dbRole;
    }
  } catch (dbErr) {
    console.warn(
      `[require-auth] DB role lookup failed for user ${user.id}, falling back to JWT role:`,
      dbErr instanceof Error ? dbErr.message : dbErr,
    );
  }

  return {
    userId: user.id,
    role,
    supabase,
  };
}
