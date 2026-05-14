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
import { awardCommunityXP, awardXP, XP_ACTIONS } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";

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
        // C-03: fire-and-forget login streak update (DB function has 20h guard)
        supabase
          .rpc("update_login_streak", { target_user_id: auth.userId })
          .then(
            () => {},
            (err: unknown) => console.error("[Profile GET] update_login_streak failed:", err),
          );

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
// DELETE - DSGVO Right-to-Erasure (Art. 17 GDPR)
// Deletes the authenticated user from auth.users; cascades to profiles via FK.
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const supabase = createAdminClient();

    // GDPR Art. 30: write erasure audit entry BEFORE deleting the user.
    // ip_hash is left NULL — GDPR requires the audit record, not the IP itself.
    const { data: erasureRow, error: insertError } = await supabase
      .from("gdpr_erasure_log")
      .insert({ user_id: auth.userId })
      .select("id")
      .single();

    if (insertError || !erasureRow) {
      // Fail-safe: abort erasure if we cannot write the audit record.
      return apiInternalError("Audit-Log konnte nicht geschrieben werden.");
    }

    const { error } = await supabase.auth.admin.deleteUser(auth.userId);

    if (error) {
      // Audit record stays with deleted_at = NULL as a failed-attempt marker.
      return apiInternalError(error.message);
    }

    // Mark erasure as complete in the audit log.
    const { error: updateError } = await supabase
      .from("gdpr_erasure_log")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", erasureRow.id);

    if (updateError) {
      // The user is already deleted. The audit row stays with deleted_at = NULL
      // as "completed but unconfirmed". Log so the ops team can reconcile.
      console.error(
        JSON.stringify({
          event: "erasure_log_update_failed",
          user_id: auth.userId,
          erasure_log_id: erasureRow.id,
          error: updateError.message,
        }),
      );
    }

    return apiSuccess({ deleted: true });
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

    // C-05: use maybeSingle() so a missing profile row returns null instead of error.
    // Also select department for M-03 department-bonus check.
    const { data: previous } = await supabase
      .from("profiles")
      .select("onboarding_completed, department")
      .eq("id", auth.userId)
      .maybeSingle();

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

    // Award XP and badges for onboarding completion exactly once.
    // C-05: Guard uses `== null` to handle both null profile row and explicit false.
    let xp_awarded: Awaited<ReturnType<typeof awardCommunityXP>> = null;
    let xp_department: Awaited<ReturnType<typeof awardXP>> = null;

    if (
      parsed.data.onboarding_completed === true &&
      (previous == null || previous.onboarding_completed === false)
    ) {
      xp_awarded = await awardCommunityXP(supabase, auth.userId, "COMPLETE_ONBOARDING");
      await checkAndAwardBadges(supabase, auth.userId);
    }

    // M-03: Award department-set bonus exactly once (idempotency handled by DB function).
    if (parsed.data.department && !previous?.department) {
      xp_department = await awardXP(
        supabase,
        auth.userId,
        XP_ACTIONS.DEPARTMENT_SET.action,
        XP_ACTIONS.DEPARTMENT_SET.amount,
        "department_set",
      );
      await checkAndAwardBadges(supabase, auth.userId);
    }

    return apiSuccess({ ...updatedProfile, xp_awarded, xp_department });
  } catch {
    return apiInternalError();
  }
}
