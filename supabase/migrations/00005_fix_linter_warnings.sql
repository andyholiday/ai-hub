-- =============================================================================
-- LR AI Hub - Fix Supabase Linter Warnings
-- Version: 00005
-- Date: 2026-02-21
-- Description: Fixes search_path on all functions and tightens 2 RLS policies.
-- Paste into: Supabase Dashboard → SQL Editor → New Query → Run
-- =============================================================================

-- =====================================================================
-- 1. FIX: search_path on all functions (security best practice)
-- =====================================================================

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_moderator_or_above() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.search_best_practices(vector, float, int) SET search_path = public;
ALTER FUNCTION public.get_leaderboard(int, int) SET search_path = public;
ALTER FUNCTION public.increment_field(text, uuid, text, int) SET search_path = public;
ALTER FUNCTION public.award_xp(uuid, int) SET search_path = public;
ALTER FUNCTION public.update_login_streak(uuid) SET search_path = public;
ALTER FUNCTION public.update_entity_comments_count() SET search_path = public;
ALTER FUNCTION public.update_entity_upvotes_count() SET search_path = public;
ALTER FUNCTION public.update_course_lessons_count() SET search_path = public;
ALTER FUNCTION public.update_course_progress_on_lesson_complete() SET search_path = public;
ALTER FUNCTION public.match_best_practices(vector, float, int, int, text, text[], text) SET search_path = public;
ALTER FUNCTION public.match_best_practices_count(vector, float, text, text[], text) SET search_path = public;

-- =====================================================================
-- 2. FIX: Tighten overly permissive RLS policies
-- =====================================================================

-- ai_cost_log: Only allow service role or the user's own cost entries
DROP POLICY IF EXISTS "ai_cost_log_insert_service" ON ai_cost_log;
CREATE POLICY "ai_cost_log_insert_service"
    ON ai_cost_log FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR is_admin());

-- notifications: Only allow inserting notifications for oneself or by admins
DROP POLICY IF EXISTS "notifications_insert_service" ON notifications;
CREATE POLICY "notifications_insert_service"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid() OR is_admin());

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
