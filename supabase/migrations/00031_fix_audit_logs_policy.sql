-- =============================================================================
-- AI Hub - Fix audit_logs INSERT policy (service_role only)
-- Version: 00031
-- Date: 2026-05-14
-- Description: The original "service inserts" policy (00024_audit_logs.sql:27-28)
--              omitted the TO clause, which caused it to default to PUBLIC.
--              Any authenticated user could therefore INSERT arbitrary rows into
--              audit_logs, poisoning the C2PA audit trail. This migration drops
--              that policy and recreates it scoped to service_role only.
--              References security audit finding C-02 (2026-05-14).
-- =============================================================================

-- Drop the overly-permissive policy idempotently.
DROP POLICY IF EXISTS "service inserts" ON audit_logs;

-- Recreate restricted to service_role only (server writes via Service-Role-Key).
-- C-02: missing TO clause let authenticated users insert fake audit rows.
CREATE POLICY "service_role inserts"
  ON audit_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
