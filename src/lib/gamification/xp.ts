// =============================================================================
// XP System Integration
// Awards XP for community actions and handles level-up notifications.
// Uses the database function `award_xp` for atomic XP + level updates.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// XP Action Constants
// ---------------------------------------------------------------------------

export const XP_ACTIONS = {
  POST_CREATED: { action: "post_created", amount: 50 },
  COMMENT_CREATED: { action: "comment_created", amount: 20 },
  UPVOTE_RECEIVED: { action: "upvote_received", amount: 10 },
  IDEA_EVALUATED: { action: "idea_evaluated", amount: 30 },
} as const;

export type XPActionKey = keyof typeof XP_ACTIONS;

// ---------------------------------------------------------------------------
// Level Thresholds (must match the DB function award_xp)
// ---------------------------------------------------------------------------

export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 300,
  4: 600,
  5: 1000,
  6: 1500,
  7: 2200,
  8: 3000,
  9: 4000,
  10: 5500,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AwardXPResult {
  newXP: number;
  newLevel: number;
  leveledUp: boolean;
}

// ---------------------------------------------------------------------------
// Core Function
// ---------------------------------------------------------------------------

/**
 * Award XP to a user via the database function `award_xp`.
 * This atomically updates XP and recalculates the user's level.
 *
 * If a level-up occurs, a notification is created for the user.
 *
 * @param supabase - Admin Supabase client (bypasses RLS)
 * @param userId - The user to award XP to
 * @param action - Human-readable action name (for logging)
 * @param amount - Amount of XP to award
 * @returns The new XP, level, and whether a level-up occurred
 */
export async function awardXP(
  supabase: SupabaseClient<Database>,
  userId: string,
  action: string,
  amount: number,
): Promise<AwardXPResult | null> {
  const { data, error } = await supabase.rpc("award_xp", {
    target_user_id: userId,
    xp_amount: amount,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  const result = data[0];
  if (!result) return null;

  const awardResult: AwardXPResult = {
    newXP: result.new_xp,
    newLevel: result.new_level,
    leveledUp: result.leveled_up,
  };

  // Create a level-up notification if applicable
  if (awardResult.leveledUp) {
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "achievement",
      title: "Level Up!",
      message: `Du hast Level ${awardResult.newLevel} erreicht! Weiter so!`,
      link: "/dashboard",
    });
  }

  return awardResult;
}

/**
 * Convenience wrapper: Award XP for a predefined community action.
 */
export async function awardCommunityXP(
  supabase: SupabaseClient<Database>,
  userId: string,
  actionKey: XPActionKey,
): Promise<AwardXPResult | null> {
  const { action, amount } = XP_ACTIONS[actionKey];
  return awardXP(supabase, userId, action, amount);
}
