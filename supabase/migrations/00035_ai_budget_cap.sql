-- =============================================================================
-- AI Hub - Per-User Monthly Budget Cap (Race-Free)
-- Version: 00035
-- Date: 2026-05-22
-- Description: Atomic budget enforcement via row-level lock on a per-user/month
--              reservation row. Prevents the TOCTOU race inherent in plain
--              SELECT SUM(ai_cost_log) pre-flight checks.
--
-- RACE-FREE DESIGN
-- ----------------
-- Naïve approach (broken):
--   1. SELECT SUM(cost) FROM ai_cost_log WHERE user_id = $1 AND month = $2
--   2. IF sum + est_cost <= limit THEN allow request
-- Two concurrent requests can both read the same sum, both see "under limit",
-- and both proceed — overshooting the cap by nearly 2x.
--
-- This migration's approach:
--   - One row per (user_id, year_month) in ai_budget_reservations holds a
--     running `reserved_usd` accumulator.
--   - The RPC check_and_reserve_ai_budget acquires a FOR UPDATE row lock on
--     that row inside a transaction. Postgres serialises all concurrent calls
--     for the same user/month on that single lock, so no two requests can
--     read the same counter simultaneously.
--   - The function uses INSERT ... ON CONFLICT DO UPDATE to ensure the row
--     exists before locking it (no separate "ensure row" round-trip needed).
--   - Because the lock is released only when the outer transaction commits,
--     the actual cost can be reconciled (UPDATE reserved_usd) in the same
--     transaction by the caller, or a best-effort reconcile can happen after
--     the AI call — either way the cap is never exceeded by more than a single
--     in-flight request's estimated cost (acceptable).
--
-- CALLER CONTRACT (enforced by DEV-5 wiring in the chat route):
--   1. Call check_and_reserve_ai_budget(user_id, est_cost, limit) → {allowed, ratio}
--   2. If allowed=false → return HTTP 429
--   3. If ratio >= 0.8 → softCap=true (use cheaper/smaller model)
--   4. After AI call completes, the actual cost difference can be reconciled:
--      UPDATE ai_budget_reservations SET reserved_usd = reserved_usd + (actual - est)
--      WHERE user_id = $1 AND year_month = current_year_month();
--      This reconcile is best-effort / fire-and-forget (same as current cost log).
--
-- SERVICE-ROLE ONLY
-- -----------------
-- The function is SECURITY DEFINER and callable only via the service-role key.
-- RLS: users may SELECT their own row (read spend ratio in UI); no client INSERT/UPDATE/DELETE.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Table: ai_budget_reservations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_budget_reservations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year_month  text        NOT NULL,                 -- format: 'YYYY-MM'
  reserved_usd numeric(12, 8) NOT NULL DEFAULT 0,  -- running accumulator in USD
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_budget_reservations_user_month_key UNIQUE (user_id, year_month)
);

-- updated_at trigger (reuses set_updated_at if it exists, else defines a minimal one)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at'
  ) THEN
    EXECUTE $func$
      CREATE FUNCTION public.set_updated_at()
      RETURNS trigger LANGUAGE plpgsql AS $body$
      BEGIN new.updated_at = now(); RETURN new; END $body$;
    $func$;
  END IF;
END $$;

DROP TRIGGER IF EXISTS ai_budget_reservations_set_updated_at ON public.ai_budget_reservations;
CREATE TRIGGER ai_budget_reservations_set_updated_at
  BEFORE UPDATE ON public.ai_budget_reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_budget_res_user_month
  ON public.ai_budget_reservations (user_id, year_month);

-- ---------------------------------------------------------------------------
-- RLS: users may read their own row; all writes are service-role only
-- ---------------------------------------------------------------------------
ALTER TABLE public.ai_budget_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budget_select_own" ON public.ai_budget_reservations;
CREATE POLICY "budget_select_own"
  ON public.ai_budget_reservations FOR SELECT
  USING (user_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for regular users.
-- Service-role bypasses RLS; no explicit policy needed for server writes.

-- ---------------------------------------------------------------------------
-- RPC: check_and_reserve_ai_budget
-- ---------------------------------------------------------------------------
-- Parameters:
--   p_user_id      uuid       — the requesting user
--   p_est_cost     numeric    — estimated cost in USD for this request
--   p_monthly_limit numeric   — monthly cap in USD (from env, passed by caller)
--
-- Returns:
--   allowed   boolean  — true if request may proceed
--   used_ratio numeric — (reserved_usd + est_cost) / monthly_limit clamped to [0, 1]
--
-- Locking strategy:
--   INSERT ... ON CONFLICT DO UPDATE acquires a row-level lock atomically.
--   SELECT ... FOR UPDATE then re-acquires it (already held; no-op in same txn)
--   and serialises any concurrent call for the same user/month.
--   The reserved_usd is incremented only when allowed=true, so the row reflects
--   the worst-case committed spend at all times.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_reserve_ai_budget(
  p_user_id       uuid,
  p_est_cost      numeric,
  p_monthly_limit numeric
)
RETURNS TABLE (allowed boolean, used_ratio numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year_month text := to_char(now(), 'YYYY-MM');
  v_current    numeric;
  v_projected  numeric;
  v_ratio      numeric;
  v_allowed    boolean;
BEGIN
  -- Ensure the row exists and acquire an exclusive row lock in one step.
  -- ON CONFLICT DO UPDATE (even a no-op update) is required so that INSERT
  -- also returns a locked row via FOR UPDATE in the subsequent SELECT.
  INSERT INTO public.ai_budget_reservations (user_id, year_month, reserved_usd)
  VALUES (p_user_id, v_year_month, 0)
  ON CONFLICT (user_id, year_month) DO UPDATE
    SET reserved_usd = ai_budget_reservations.reserved_usd; -- no-op; triggers FOR UPDATE lock

  -- Re-read under FOR UPDATE to guarantee this session holds the lock
  -- (needed because the INSERT path above does not implicitly lock for reads).
  SELECT abr.reserved_usd
    INTO v_current
    FROM public.ai_budget_reservations abr
   WHERE abr.user_id = p_user_id
     AND abr.year_month = v_year_month
     FOR UPDATE;

  v_projected := v_current + p_est_cost;
  v_ratio     := LEAST(v_projected / NULLIF(p_monthly_limit, 0), 1.0);
  v_allowed   := v_projected <= p_monthly_limit;

  -- Atomically reserve the estimated cost when allowed
  IF v_allowed THEN
    UPDATE public.ai_budget_reservations
       SET reserved_usd = v_projected
     WHERE user_id = p_user_id
       AND year_month = v_year_month;
  END IF;

  RETURN QUERY SELECT v_allowed, COALESCE(v_ratio, 0.0);
END;
$$;

-- Restrict EXECUTE to service_role only (revoke from public, anon, authenticated)
REVOKE ALL ON FUNCTION public.check_and_reserve_ai_budget(uuid, numeric, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_and_reserve_ai_budget(uuid, numeric, numeric) FROM anon;
REVOKE ALL ON FUNCTION public.check_and_reserve_ai_budget(uuid, numeric, numeric) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_reserve_ai_budget(uuid, numeric, numeric) TO service_role;

-- Table: service_role needs INSERT, UPDATE, SELECT to drive the budget accumulator.
-- Authenticated users get SELECT only (governed further by the RLS policy above).
GRANT SELECT, INSERT, UPDATE ON public.ai_budget_reservations TO service_role;
GRANT SELECT ON public.ai_budget_reservations TO authenticated;

COMMENT ON TABLE public.ai_budget_reservations IS
  'Per-user/month running cost accumulator for AI budget cap enforcement (ADR: see 00035 header).';

COMMENT ON FUNCTION public.check_and_reserve_ai_budget(uuid, numeric, numeric) IS
  'Atomically checks and reserves estimated AI cost. Returns (allowed, used_ratio). '
  'Uses FOR UPDATE row lock to prevent concurrent over-spend. Service-role only.';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
