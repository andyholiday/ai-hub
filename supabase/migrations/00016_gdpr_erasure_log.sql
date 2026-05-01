-- =============================================================================
-- AI Hub - GDPR Art. 30 Erasure Audit Log
-- Version: 00016
-- Date: 2026-04-30
-- Description: Audit log for Right-to-Erasure (Art. 17 GDPR) requests.
--              Intentionally no FK on user_id: the referenced user is deleted
--              after the erasure completes, so a FK would either cascade-delete
--              the audit record (defeating the purpose) or block the delete.
--
-- F06 Fix — Quality finding: High / GDPR Art. 30
-- Phase 0 Hardening
-- =============================================================================

CREATE TABLE public.gdpr_erasure_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL,   -- intentionally no FK (user is deleted afterwards)
  requested_at timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,            -- NULL = in-progress / failed attempt
  ip_hash      text,                   -- SHA-256 hash of request IP (optional, may be NULL)
  created_at   timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gdpr_erasure_log IS
  'GDPR Art. 30 audit log for Right-to-Erasure requests. '
  'user_id is intentionally not FK-bound because the user is deleted afterwards.';

COMMENT ON COLUMN public.gdpr_erasure_log.deleted_at IS
  'NULL means the erasure is in-progress or failed. Filled after auth.admin.deleteUser() succeeds.';

COMMENT ON COLUMN public.gdpr_erasure_log.ip_hash IS
  'Optional SHA-256 hash of the request IP address for forensic purposes. May be NULL.';

-- ---------------------------------------------------------------------------
-- Row Level Security: only service_role may access this table.
-- Authenticated users must not be able to read or alter audit records.
-- ---------------------------------------------------------------------------

ALTER TABLE public.gdpr_erasure_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gdpr_erasure_log_service_only"
  ON public.gdpr_erasure_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE ON public.gdpr_erasure_log TO service_role;

-- ---------------------------------------------------------------------------
-- Index: erasure log queries will typically filter by requested_at (reporting)
-- ---------------------------------------------------------------------------

CREATE INDEX idx_gdpr_erasure_log_requested_at
  ON public.gdpr_erasure_log (requested_at DESC);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
