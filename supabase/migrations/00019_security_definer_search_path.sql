-- =============================================================================
-- AI Hub - SECURITY DEFINER search_path Hardening
-- Version: 00019
-- Date: 2026-05-01
-- Description: Migration 00005 set search_path on award_xp, increment_field,
--              and update_login_streak. However migration 00007 re-created
--              update_login_streak via CREATE OR REPLACE without SET search_path,
--              silently clearing the setting.
--
--              This migration re-applies search_path = public, extensions to all
--              three SECURITY DEFINER functions that are called from application
--              code and RLS policies. Without an explicit search_path, a
--              malicious session-level SET search_path can redirect function
--              calls to attacker-controlled objects.
-- =============================================================================

-- award_xp(uuid, int) — defined in 00001, search_path set in 00005
ALTER FUNCTION public.award_xp(uuid, int)
  SET search_path = public, extensions;

-- increment_field(text, uuid, text, int) — defined in 00001, search_path set in 00005
ALTER FUNCTION public.increment_field(text, uuid, text, int)
  SET search_path = public, extensions;

-- update_login_streak(uuid) — redefined in 00007 without search_path (resets 00005 fix)
ALTER FUNCTION public.update_login_streak(uuid)
  SET search_path = public, extensions;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
