// =============================================================================
// Challenge Progress API
// PATCH /api/challenges/[challengeId]/progress - Report a server-known event
//
// Task 11 hardening:
// - Accepts event-based body instead of arbitrary { progress: number }
// - Server maps event → progress increment (client cannot self-award 100)
// - One-time XP via challenge_completions upsert with ignoreDuplicates=true
// =============================================================================

import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { updateProgressSchema } from "@/lib/validators/challenges";
import { awardXP } from "@/lib/gamification/xp";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Server-side event → progress-increment mapping
// Each event type advances progress by a fixed, server-controlled amount.
// ---------------------------------------------------------------------------

const EVENT_INCREMENT: Record<string, number> = {
  lesson_completed: 33,
  step_done: 10,
  quiz_passed: 34,
};

// ---------------------------------------------------------------------------
// Route context type
// ---------------------------------------------------------------------------

type RouteContext = {
  params: Promise<{ challengeId: string }>;
};

// ---------------------------------------------------------------------------
// PATCH - Report a server-known progress event for a challenge
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { challengeId } = await context.params;

    const body: unknown = await req.json();
    const parsed = updateProgressSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { eventType } = parsed.data;
    const increment = EVENT_INCREMENT[eventType] ?? 10;
    // User-context for queries/updates on user-owned data (RLS enforced).
    // Admin-client only retained for `challenge_completions` upsert (no user
    // INSERT policy) and `awardXP` (service_role RPC).
    const supabase = auth.supabase as unknown as SupabaseClient<Database>;
    const admin = createAdminClient();

    // Check if user has joined this challenge
    const { data: userChallenge, error: fetchError } = await supabase
      .from("user_challenges")
      .select("user_id, challenge_id, progress, completed_at")
      .eq("user_id", auth.userId)
      .eq("challenge_id", challengeId)
      .single();

    if (fetchError || !userChallenge) {
      return apiNotFound("Du nimmst nicht an dieser Challenge teil");
    }

    // Prevent updating already completed challenges
    if (userChallenge.completed_at) {
      return apiBadRequest("Diese Challenge wurde bereits abgeschlossen");
    }

    // Server caps progress: client cannot push beyond server-computed value
    const newProgress = Math.min(100, (userChallenge.progress ?? 0) + increment);

    const updatePayload: {
      progress: number;
      completed_at?: string;
    } = { progress: newProgress };

    if (newProgress === 100) {
      updatePayload.completed_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from("user_challenges")
      .update(updatePayload)
      .eq("user_id", auth.userId)
      .eq("challenge_id", challengeId)
      .select("progress, completed_at")
      .single();

    if (updateError) {
      return apiInternalError(updateError.message);
    }

    // One-time XP award via challenge_completions (Task 11)
    let xpResult = null;
    if (newProgress === 100) {
      const { data: challenge } = await supabase
        .from("challenges")
        .select("xp_reward, title")
        .eq("id", challengeId)
        .single();

      if (challenge) {
        // Upsert with ignoreDuplicates=true ensures XP is awarded exactly once.
        // Service-role: challenge_completions has no user-INSERT RLS policy.
        const { data: insertedRows, error: insertError } = await admin
          .from("challenge_completions")
          .upsert(
            { user_id: auth.userId, challenge_id: challengeId, xp_awarded: challenge.xp_reward },
            { onConflict: "user_id,challenge_id", ignoreDuplicates: true }
          )
          .select("user_id");

        if (insertError) {
          return apiInternalError(insertError.message);
        }

        if ((insertedRows ?? []).length > 0) {
          // awardXP uses the `award_xp` RPC (service_role only).
          xpResult = await awardXP(
            admin,
            auth.userId,
            `challenge_completed:${challengeId}`,
            challenge.xp_reward
          );

          // notifications_insert_service policy permits user_id = auth.uid().
          await supabase.from("notifications").insert({
            user_id: auth.userId,
            type: "challenge",
            title: "Challenge abgeschlossen!",
            message: `Du hast die Challenge "${challenge.title}" erfolgreich abgeschlossen und ${challenge.xp_reward} XP verdient!`,
            link: `/challenges/${challengeId}`,
          });
        }
      }
    }

    return apiSuccess({
      progress: updated?.progress ?? newProgress,
      completedAt: updated?.completed_at ?? null,
      xpAwarded: xpResult
        ? { newXP: xpResult.newXP, newLevel: xpResult.newLevel, leveledUp: xpResult.leveledUp }
        : null,
    });
  } catch {
    return apiInternalError();
  }
}
