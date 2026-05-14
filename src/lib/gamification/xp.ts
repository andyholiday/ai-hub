// =============================================================================
// XP System Integration
// Awards XP for community actions and handles level-up notifications.
// Uses the database function `award_xp_idempotent` for atomic XP + level updates.
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { getRedis } from "@/lib/api/rate-limit";

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
  DEPARTMENT_SET: { action: "department_set", amount: 25 },
} as const;

export type XPActionKey = keyof typeof XP_ACTIONS;

// ---------------------------------------------------------------------------
// Level Thresholds (must match the DB function award_xp_idempotent)
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
// Internal: SQL fallback for daily cap when Redis is unavailable
// ---------------------------------------------------------------------------

async function getDailyXPFromDB(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<number | null> {
  try {
    // Raw aggregate query on xp_log for today
    const { data, error } = await supabase
      .from("xp_log")
      .select("amount")
      .eq("user_id", userId)
      .gte("awarded_at", new Date().toISOString().split("T")[0]);

    if (error) return null;
    const total = (data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0);
    return total;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core Function
// ---------------------------------------------------------------------------

/**
 * Award XP to a user via the database function `award_xp_idempotent`.
 * The DB function atomically inserts xp_log and updates profiles.xp.
 * The xp_log INSERT is the idempotency gate — no double-award is possible.
 *
 * Order: read Redis cap → RPC (atomic) → incrby Redis.
 * Redis is only incremented after a successful RPC to prevent
 * consuming the daily cap when the DB write fails.
 *
 * M-07: If Redis read fails, falls back to xp_log SUM in DB.
 * If both fail, returns null (fail-closed).
 *
 * @param supabase - Admin Supabase client (bypasses RLS)
 * @param userId - The user to award XP to
 * @param action - Human-readable action name (stored in xp_log)
 * @param amount - Amount of XP to award
 * @param idempotencyKey - Optional: prevents double-award for the same
 *   (user, action, key) triple via ON CONFLICT in the DB function.
 *   Pass undefined for non-idempotent awards (legacy behaviour).
 * @returns The new XP, level, and whether a level-up occurred; null if
 *   already awarded (idempotent) or daily cap reached.
 */
export async function awardXP(
  supabase: SupabaseClient<Database>,
  userId: string,
  action: string,
  amount: number,
  idempotencyKey?: string,
): Promise<AwardXPResult | null> {
  // 1. Read daily cap — Redis first, DB fallback (M-07)
  const redis = getRedis();
  let redisKey: string | null = null;

  if (redis) {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    redisKey = `daily_xp:${userId}:${today}`;
    try {
      const currentDailyXp = (await redis.get<number>(redisKey)) ?? 0;
      if (currentDailyXp + amount > DAILY_XP_LIMIT) {
        console.warn(
          `[XP] User ${userId} would exceed daily cap (${currentDailyXp}+${amount}/${DAILY_XP_LIMIT}). Action: ${action} ignored.`,
        );
        return null;
      }
    } catch (err) {
      console.error("[XP] Redis daily cap read failed, falling back to DB cap check:", err);
      redisKey = null; // skip Redis increment later

      // M-07: SQL fallback for cap check
      const dbDailyXp = await getDailyXPFromDB(supabase, userId);
      if (dbDailyXp === null) {
        // Both Redis and DB failed → fail-closed
        console.error("[XP] DB cap fallback also failed. Aborting award (fail-closed).");
        return null;
      }
      if (dbDailyXp + amount > DAILY_XP_LIMIT) {
        console.warn(
          `[XP] User ${userId} would exceed daily cap via DB check (${dbDailyXp}+${amount}/${DAILY_XP_LIMIT}). Action: ${action} ignored.`,
        );
        return null;
      }
    }
  }

  // 2. Award XP atomically via new idempotent DB function (C-04)
  // The DB function handles: xp_log insert (idempotency gate) + profiles.xp update + level recalc.
  const { data, error } = await supabase.rpc("award_xp_idempotent", {
    target_user_id: userId,
    xp_amount: amount,
    action_text: action,
    idem_key: idempotencyKey ?? null,
  });

  if (error || !data || data.length === 0) {
    console.error("[XP] award_xp_idempotent RPC failed:", error);
    return null;
  }

  const result = data[0];
  if (!result) return null;

  // If the DB reports `awarded=false`, the idempotency key was a duplicate — skip silently.
  if (!result.awarded) {
    return null;
  }

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

  // 4. Create a level-up notification if applicable
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
 * DEPARTMENT_SET uses a fixed idempotency key (1× per user).
 */
export async function awardCommunityXP(
  supabase: SupabaseClient<Database>,
  userId: string,
  actionKey: XPActionKey,
): Promise<AwardXPResult | null> {
  const { action, amount } = XP_ACTIONS[actionKey];
  let idempotencyKey: string | undefined;
  if (actionKey === "COMPLETE_ONBOARDING") {
    idempotencyKey = "complete_onboarding";
  } else if (actionKey === "DEPARTMENT_SET") {
    idempotencyKey = "department_set";
  }
  return awardXP(supabase, userId, action, amount, idempotencyKey);
}
