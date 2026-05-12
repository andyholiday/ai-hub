-- =============================================================================
-- Migration: Revoke Client Execute on Dangerous RPCs
-- Version: 00026
-- Date: 2026-05-12
-- Description: Closes direct-client-RPC privilege gap (AUDIT-2026-05-12 Task 3).
--              Migration 00019 fixed search_path but left EXECUTE open to
--              authenticated/anon/PUBLIC on three gamification RPCs:
--                - increment_field
--                - award_xp
--                - update_login_streak
--              Any authenticated user could call these directly and award
--              themselves arbitrary XP or manipulate counters.
--
--              Fix: REVOKE EXECUTE from PUBLIC, anon, authenticated.
--              GRANT EXECUTE exclusively to service_role.
--              Callers in src/lib/gamification/ must use createAdminClient().
-- =============================================================================

BEGIN;

-- increment_field(text, uuid, text, int)
REVOKE EXECUTE ON FUNCTION public.increment_field(text, uuid, text, int)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.increment_field(text, uuid, text, int)
  TO service_role;

-- award_xp(uuid, int)
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, int)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.award_xp(uuid, int)
  TO service_role;

-- update_login_streak(uuid)
REVOKE EXECUTE ON FUNCTION public.update_login_streak(uuid)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.update_login_streak(uuid)
  TO service_role;

-- Smoke checks (run in Supabase SQL editor after apply):
-- SELECT has_function_privilege('authenticated', 'public.award_xp(uuid,int)', 'EXECUTE');
-- Expected: false
-- SELECT has_function_privilege('authenticated', 'public.increment_field(text,uuid,text,int)', 'EXECUTE');
-- Expected: false
-- SELECT has_function_privilege('authenticated', 'public.update_login_streak(uuid)', 'EXECUTE');
-- Expected: false
-- SELECT has_function_privilege('service_role', 'public.award_xp(uuid,int)', 'EXECUTE');
-- Expected: true

COMMIT;
