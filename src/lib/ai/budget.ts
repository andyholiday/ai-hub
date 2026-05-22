// =============================================================================
// AI Budget Enforcement Helper
// Server-only. Call via the admin (service-role) Supabase client.
// =============================================================================
// USAGE IN THE CHAT ROUTE (DEV-5 wires this):
//
//   import { enforceBudget } from "@/lib/ai/budget";
//
//   const budget = await enforceBudget(userId, estimatedCost);
//
//   if (!budget.allowed) {
//     return new Response(
//       JSON.stringify({ error: "Monthly AI budget exceeded." }),
//       { status: 429, headers: { "Content-Type": "application/json" } }
//     );
//   }
//
//   if (budget.softCap) {
//     // Downgrade to the cheapest available model for this provider.
//   }
// =============================================================================

import { createAdminClient } from "@/lib/supabase/admin";

/** Returned by enforceBudget */
export interface BudgetResult {
  /** True if the request is within the monthly limit. Return 429 when false. */
  allowed: boolean;
  /** Projected spend / monthly limit, clamped to [0, 1]. */
  ratio: number;
  /** True when ratio >= 0.8 — caller should downgrade to a cheaper model. */
  softCap: boolean;
}

/** Soft-cap threshold: warn/downgrade at 80 % of monthly budget. */
const SOFT_CAP_THRESHOLD = 0.8;

/**
 * Atomically checks whether the user has budget remaining and reserves the
 * estimated cost. Uses a Postgres row-level lock (FOR UPDATE) so concurrent
 * requests for the same user/month are serialised — no TOCTOU race.
 *
 * @param userId   - Supabase auth user ID (UUID string)
 * @param estCost  - Estimated cost in USD for the upcoming AI call
 * @returns        BudgetResult — allowed, ratio, softCap
 *
 * @throws When the RPC call fails (network error, Supabase down, etc.).
 *         The caller (chat route) should catch and allow the request through
 *         or return 503, depending on the desired fail-open/fail-closed policy.
 */
export async function enforceBudget(
  userId: string,
  estCost: number,
): Promise<BudgetResult> {
  const monthlyLimitUsd = parseFloat(
    process.env.USER_MONTHLY_COST_LIMIT_USD ?? "1.0",
  );

  const admin = createAdminClient();

  // Cast to `any` because the generated Database types predate migration 00025.
  // Once `supabase gen types typescript` is re-run after applying the migration,
  // the cast can be removed and the RPC will be fully typed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated types stale pre-migration
  const { data, error } = await (admin as any).rpc(
    "check_and_reserve_ai_budget",
    {
      p_user_id: userId,
      p_est_cost: estCost,
      p_monthly_limit: monthlyLimitUsd,
    },
  ) as { data: Array<{ allowed: boolean; used_ratio: number }> | null; error: { message: string } | null };

  if (error) {
    throw new Error(`Budget RPC failed: ${error.message}`);
  }

  // The RPC returns a single row via RETURN QUERY SELECT.
  const row = Array.isArray(data) && data.length > 0 ? data[0] : null;

  const allowed: boolean = row?.allowed ?? true; // fail-open if row is unexpected
  const ratio: number = typeof row?.used_ratio === "number" ? row.used_ratio : 0;

  return {
    allowed,
    ratio,
    softCap: ratio >= SOFT_CAP_THRESHOLD,
  };
}
