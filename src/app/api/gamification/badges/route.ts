// =============================================================================
// Badges API
// GET /api/gamification/badges            - List all available badges
// GET /api/gamification/badges?userId=... - List badges earned by the session user
//   Note: ?userId param is accepted for backwards compat but always resolved to
//   the authenticated session user (prevents enumeration by arbitrary UUID).
// =============================================================================

import { NextRequest } from "next/server";
import {
  apiSuccess,
  apiInternalError,
} from "@/lib/api/response";
import { requireAuth } from "@/lib/api/require-auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET - List badges
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    // Auth required – prevents unauthenticated enumeration of user_badges
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { userId: sessionUserId } = auth;
    // Cast: createServerClient<Database> and createClient<Database> both return
    // SupabaseClient<Database>; the cast aligns the generic for tsc.
    const supabase = auth.supabase as unknown as SupabaseClient<Database>;

    const { searchParams } = new URL(req.url);
    // ?userId is accepted for API compatibility but always replaced with the
    // session user to prevent cross-user badge enumeration.
    const userId = searchParams.get("userId") ? sessionUserId : null;

    if (userId !== null) {
      // Fetch badge IDs earned by this user
      const { data: userBadgeRows, error: ubError } = await supabase
        .from("user_badges")
        .select("badge_id, earned_at")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (ubError) {
        return apiInternalError(ubError.message);
      }

      if (!userBadgeRows || userBadgeRows.length === 0) {
        return apiSuccess([]);
      }

      // Fetch badge details
      const badgeIds = userBadgeRows.map((ub) => ub.badge_id);
      const { data: badgeRows, error: bError } = await supabase
        .from("badges")
        .select("*")
        .in("id", badgeIds);

      if (bError) {
        return apiInternalError(bError.message);
      }

      // Merge earned_at into badge data
      const badgeMap = new Map(
        (badgeRows ?? []).map((b) => [b.id, b]),
      );

      const result = userBadgeRows
        .map((ub) => {
          const badge = badgeMap.get(ub.badge_id);
          if (!badge) return null;
          return { ...badge, earned_at: ub.earned_at };
        })
        .filter((b) => b !== null);

      return apiSuccess(result);
    }

    // Fetch all available badges
    const { data: badges, error } = await supabase
      .from("badges")
      .select("*")
      .order("category", { ascending: true });

    if (error) {
      return apiInternalError(error.message);
    }

    return apiSuccess(badges ?? []);
  } catch {
    return apiInternalError();
  }
}
