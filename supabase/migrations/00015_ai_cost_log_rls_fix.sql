-- =============================================================================
-- LR AI Hub - Fix ai_cost_log INSERT RLS Policy
-- Version: 00015
-- Date: 2026-04-30
-- Description: Tightens the INSERT policy on ai_cost_log.
--              The previous policy (00005) used WITH CHECK (user_id = auth.uid()
--              OR is_admin()), which still allows an admin to write cost entries
--              for any user_id. This migration locks it down so authenticated
--              users can only insert rows where user_id = their own auth.uid().
--              Service-role writes (server-side logging) bypass RLS entirely
--              and are unaffected.
--
-- Phase 0 Hardening — Task 0.6, RLS High
-- =============================================================================

-- Drop the existing policy created by 00005_fix_linter_warnings.sql
DROP POLICY IF EXISTS "ai_cost_log_insert_service" ON ai_cost_log;

-- Recreate with strict user_id check
CREATE POLICY "ai_cost_log_insert_own"
    ON ai_cost_log FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- NOTE: Server-side cost logging (Next.js route handlers using the
-- service-role client) is NOT affected — the service role bypasses RLS.
-- Only authenticated browser requests are constrained by this policy.
-- =============================================================================

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
