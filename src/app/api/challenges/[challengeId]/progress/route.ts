// =============================================================================
// Challenge Progress API
// PATCH /api/challenges/[challengeId]/progress - Update user progress
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiNotFound,
  apiBadRequest,
  apiValidationError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProgressSchema } from "@/lib/validators/challenges";
import { awardXP } from "@/lib/gamification/xp";

// ---------------------------------------------------------------------------
// Route context type
// ---------------------------------------------------------------------------

type RouteContext = {
  params: Promise<{ challengeId: string }>;
};

// ---------------------------------------------------------------------------
// PATCH - Update progress on a challenge
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

    const { progress } = parsed.data;
    const supabase = createAdminClient();

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

    // Build the update payload
    const updatePayload: {
      progress: number;
      completed_at?: string;
    } = { progress };

    // If progress reaches 100, mark as completed
    if (progress === 100) {
      updatePayload.completed_at = new Date().toISOString();
    }

    // Update the progress
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

    // Award XP if challenge completed
    let xpResult = null;
    if (progress === 100) {
      // Fetch the challenge to get XP reward amount
      const { data: challenge } = await supabase
        .from("challenges")
        .select("xp_reward, title")
        .eq("id", challengeId)
        .single();

      if (challenge) {
        xpResult = await awardXP(
          supabase,
          auth.userId,
          `challenge_completed:${challengeId}`,
          challenge.xp_reward
        );

        // Create a completion notification
        await supabase.from("notifications").insert({
          user_id: auth.userId,
          type: "challenge",
          title: "Challenge abgeschlossen!",
          message: `Du hast die Challenge "${challenge.title}" erfolgreich abgeschlossen und ${challenge.xp_reward} XP verdient!`,
          link: `/challenges/${challengeId}`,
        });
      }
    }

    return apiSuccess({
      progress: updated?.progress ?? progress,
      completedAt: updated?.completed_at ?? null,
      xpAwarded: xpResult
        ? { newXP: xpResult.newXP, newLevel: xpResult.newLevel, leveledUp: xpResult.leveledUp }
        : null,
    });
  } catch {
    return apiInternalError();
  }
}
