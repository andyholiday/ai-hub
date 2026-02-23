// =============================================================================
// Profile API
// GET   /api/profile - Fetch current user's profile with badges and stats
// PATCH /api/profile - Update profile fields (full_name, bio, department, position)
//
// ROBUST: Uses a 3-tier fallback strategy:
// 1. Try optimized RPC function (get_user_profile_data) - fastest
// 2. Try direct table queries - works if GRANTs are applied
// 3. Fall back to Auth Admin API - always works (minimal data)
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProfileSchema } from "@/lib/validators/profile";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET - Fetch authenticated user's full profile
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const supabase = createAdminClient();

    // ---- Tier 1: Try optimized single RPC call (requires migration 00009) ----
    const { data: rawData, error: rpcError } = await supabase.rpc("get_user_profile_data", {
      target_user_id: auth.userId,
    });

    if (!rpcError) {
      const data = rawData as unknown as {
        profile: Record<string, unknown> | null;
        badges: unknown[];
        stats: { postsCount: number; coursesCompleted: number };
      } | null;

      if (data?.profile) {
        return apiSuccess(data);
      }
    }

    // ---- Tier 2: Try direct table queries (requires migration 00008 GRANTs) ----
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", auth.userId)
      .single();

    if (!profileError && profile) {
      // Profile query works - fetch remaining data
      const { data: userBadges } = await supabase
        .from("user_badges")
        .select("*, badges(*)")
        .eq("user_id", auth.userId);

      const badges = (userBadges ?? []).map((ub: Record<string, unknown>) => {
        const badge = ub.badges as Record<string, unknown> | null;
        return {
          id: badge?.id,
          key: badge?.key,
          name: badge?.name,
          description: badge?.description,
          icon: badge?.icon,
          category: badge?.category,
          xp_threshold: badge?.xp_threshold,
          condition: badge?.condition,
          created_at: badge?.created_at,
          earned_at: ub.earned_at,
        };
      });

      const { count: postsCount } = await supabase
        .from("community_posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", auth.userId);

      const { count: coursesCompleted } = await supabase
        .from("user_course_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", auth.userId)
        .not("completed_at", "is", null);

      return apiSuccess({
        profile,
        badges,
        stats: {
          postsCount: postsCount ?? 0,
          coursesCompleted: coursesCompleted ?? 0,
        },
      });
    }

    // ---- Tier 3: Auth Admin API fallback (always works, minimal data) ----
    // When table GRANTs are missing, we can still get basic user info from
    // the Auth Admin API, which uses a separate permission model.
    console.warn(
      "[Profile API] Table access denied. Using Auth Admin fallback.",
      profileError?.message,
    );

    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(auth.userId);

    if (authError || !authUser?.user) {
      return apiInternalError(
        "Profildaten konnten nicht geladen werden. " +
        "Bitte führe die Migration 00008_fix_grants.sql im Supabase Dashboard aus.",
      );
    }

    const user = authUser.user;

    // Build a minimal profile from auth user data
    const fallbackProfile = {
      id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "User",
      email: user.email,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      xp: 0,
      xp_total: 0,
      level: 1,
      streak_days: 0,
      longest_streak: 0,
      role: user.app_metadata?.role ?? "user",
      department: null,
      position: null,
      bio: null,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return apiSuccess({
      profile: fallbackProfile,
      badges: [],
      stats: {
        postsCount: 0,
        coursesCompleted: 0,
      },
    });
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// PATCH - Update profile fields
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const body: unknown = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const supabase = createAdminClient();

    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.userId)
      .select("*")
      .single();

    if (error) {
      return apiInternalError(error.message);
    }

    return apiSuccess(updatedProfile);
  } catch {
    return apiInternalError();
  }
}
