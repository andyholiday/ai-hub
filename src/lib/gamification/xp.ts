// =============================================================================
// XP System Integration
// Awards XP for community actions and handles level-up notifications.
// Uses the database function `award_xp` for atomic XP + level updates.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getRedis } from "@/lib/api/rate-limit";

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DAILY_XP_LIMIT = 500;

// ---------------------------------------------------------------------------
// XP Action Constants
// ---------------------------------------------------------------------------

export const XP_ACTIONS = {
  POST_CREATED: { action: "post_created", amount: 50 },
  COMMENT_CREATED: { action: "comment_created", amount: 20 },
  UPVOTE_RECEIVED: { action: "upvote_received", amount: 10 },
  IDEA_EVALUATED: { action: "idea_evaluated", amount: 30 },
  COMPLETE_ONBOARDING: { action: "complete_onboarding", amount: 50 },
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
 * Order: read Redis cap → RPC → incrby Redis → write xp_log.
 * Redis is only incremented after a successful RPC to prevent
 * consuming the daily cap when the DB write fails.
 *
 * @param supabase - Admin Supabase client (bypasses RLS)
 * @param userId - The user to award XP to
 * @param action - Human-readable action name (for logging)
 * @param amount - Amount of XP to award
 * @param idempotencyKey - Optional: when set, prevents double-award for the
 *   same (user, action, key) triple. Pass null for non-idempotent awards.
 * @returns The new XP, level, and whether a level-up occurred
 */
export async function awardXP(
  supabase: SupabaseClient<Database>,
  userId: string,
  action: string,
  amount: number,
  idempotencyKey?: string,
): Promise<AwardXPResult | null> {
  // 0. Idempotency pre-check: avoid calling RPC when already processed
  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from("xp_log")
      .select("id")
      .eq("user_id", userId)
      .eq("action", action)
      .eq("idempotency_key", idempotencyKey)
      .limit(1)
      .maybeSingle();
    if (existing) return null;
  }

  // 1. Read daily cap from Redis (read-only, no mutation yet)
  const redis = getRedis();
  let redisKey: string | null = null;
  if (redis) {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    redisKey = `daily_xp:${userId}:${today}`;
    try {
      const currentDailyXp = (await redis.get<number>(redisKey)) || 0;

      if (currentDailyXp + amount > DAILY_XP_LIMIT) {
        console.warn(`[XP] User ${userId} would exceed daily cap (${currentDailyXp}+${amount}/${DAILY_XP_LIMIT}). Action: ${action} ignored.`);
        return null;
      }
    } catch (err) {
      console.error("[XP] Redis daily cap read failed, gracefully continuing:", err);
      redisKey = null; // skip Redis increment later to avoid phantom state
    }
  }

  // 2. Award XP in database (must succeed before Redis is mutated)
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

  // 3. Increment Redis cap only after successful DB write
  if (redis && redisKey) {
    try {
      await redis.incrby(redisKey, amount);
      await redis.expire(redisKey, 86400);
    } catch (err) {
      // Non-fatal: cap may be slightly off until next read corrects it
      console.error("[XP] Redis daily cap increment failed after successful RPC:", err);
    }
  }

  // 4. Write audit log entry (best-effort; idempotency_key prevents double-award)
  const xpLogPayload: {
    user_id: string;
    action: string;
    amount: number;
    idempotency_key?: string;
  } = { user_id: userId, action, amount };
  if (idempotencyKey) {
    xpLogPayload.idempotency_key = idempotencyKey;
  }
  const { error: logError } = await supabase.from("xp_log").insert(xpLogPayload);
  if (logError) {
    if (logError.code === "23505") {
      // Race condition: pre-check passed but a concurrent request inserted first.
      // The RPC has already run and XP was awarded — this is a double-award race.
      // Ops should investigate if this fires frequently.
      console.warn("[XP] xp_double_award_race", {
        event: "xp_double_award_race",
        user_id: userId,
        action,
        idempotency_key: idempotencyKey,
      });
      return null;
    }
    // Other log errors are non-fatal — XP was already awarded above
    console.error("[XP] xp_log insert failed (non-fatal):", logError);
  }

  // 5. Create a level-up notification if applicable
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
 * COMPLETE_ONBOARDING uses a lifetime idempotency key (1× per user).
 */
export async function awardCommunityXP(
  supabase: SupabaseClient<Database>,
  userId: string,
  actionKey: XPActionKey,
): Promise<AwardXPResult | null> {
  const { action, amount } = XP_ACTIONS[actionKey];
  const idempotencyKey = actionKey === "COMPLETE_ONBOARDING" ? "complete_onboarding" : undefined;
  return awardXP(supabase, userId, action, amount, idempotencyKey);
}
