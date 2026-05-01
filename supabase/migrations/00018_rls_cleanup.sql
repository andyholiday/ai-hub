-- =============================================================================
-- AI Hub - RLS Cleanup: Remove unintended anon SELECT on mentor_signals
-- Version: 00018
-- Date: 2026-05-01
-- Description: Migration 00010 line 104 granted SELECT ON mentor_signals TO
--              anon. mentor_signals contains personal data (user signals, XP,
--              streak info). Anon users must not be able to read any rows.
--              RLS policies already restrict row access to the owning user, but
--              revoking the table-level GRANT closes the privilege gap entirely.
-- =============================================================================

REVOKE SELECT ON public.mentor_signals FROM anon;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
