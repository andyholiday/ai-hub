-- =============================================================================
-- LR AI Hub - Fix Missing GRANT Statements (Critical Bug Fix)
-- Version: 00008
-- Date: 2026-02-21
-- Description: Adds GRANT statements for all tables, sequences, and functions.
--   PostgreSQL requires TWO layers of permission:
--     1. GRANT  - base permission allowing a role to access an object at all
--     2. RLS    - fine-grained row-level access control
--   The initial migrations (00001-00007) only set up RLS policies but never
--   issued GRANTs. Without GRANTs the 'authenticated' role cannot touch any
--   table, resulting in "permission denied for table profiles" errors that
--   block login, dashboards, and all authenticated operations.
--
-- This migration is IDEMPOTENT: GRANT statements are safe to run repeatedly;
-- PostgreSQL silently ignores a GRANT that already exists.
-- =============================================================================

-- =============================================================================
-- 1. SCHEMA USAGE GRANT
-- =============================================================================
-- Both roles need USAGE on the public schema to resolve any object within it.

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- =============================================================================
-- 2. TABLE GRANTS - authenticated role
-- =============================================================================
-- The 'authenticated' role needs SELECT, INSERT, UPDATE, DELETE on all tables.
-- Actual row-level filtering is handled by RLS policies already in place.

-- From 00001_initial_schema.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.best_practices        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.courses               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lessons               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.community_posts       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.comments              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_providers          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.system_prompts        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_cost_log           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_chat_sessions      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_chat_messages      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.usecase_evaluations   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.challenges            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_challenges       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_course_progress  TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.badges                TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_badges           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.upvotes               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.innovation_radar_items TO authenticated;

-- From 00002_feature_flags.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.feature_flags         TO authenticated;

-- From 00004_learn_hub.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_lesson_progress  TO authenticated;

-- From 00006_learning_paths.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.learning_paths             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.learning_path_courses      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_learning_path_progress TO authenticated;

-- From 00007_advanced_gamification.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.achievements          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_achievements     TO authenticated;

-- =============================================================================
-- 3. TABLE GRANTS - anon role (minimal read-only access)
-- =============================================================================
-- The 'anon' role is used by unauthenticated clients. Only grant SELECT on
-- tables that have public-facing data (leaderboard, published content, etc.).
-- RLS policies will further restrict what rows are visible (most policies
-- target 'authenticated' only, so anon will see nothing unless a policy
-- explicitly allows it via TO anon or TO public).

-- Profiles: needed for leaderboard, public user cards
GRANT SELECT ON TABLE public.profiles TO anon;

-- Published content that may be shown on landing/public pages
GRANT SELECT ON TABLE public.best_practices        TO anon;
GRANT SELECT ON TABLE public.courses                TO anon;
GRANT SELECT ON TABLE public.lessons                TO anon;
GRANT SELECT ON TABLE public.community_posts        TO anon;
GRANT SELECT ON TABLE public.comments               TO anon;
GRANT SELECT ON TABLE public.challenges             TO anon;
GRANT SELECT ON TABLE public.badges                 TO anon;
GRANT SELECT ON TABLE public.innovation_radar_items TO anon;

-- Feature flags: needed to gate features before login
GRANT SELECT ON TABLE public.feature_flags TO anon;

-- Achievements: public display
GRANT SELECT ON TABLE public.achievements TO anon;

-- Learning paths: public catalog
GRANT SELECT ON TABLE public.learning_paths        TO anon;
GRANT SELECT ON TABLE public.learning_path_courses TO anon;

-- =============================================================================
-- 4. SEQUENCE GRANTS
-- =============================================================================
-- Grant USAGE and SELECT on ALL sequences so uuid_generate_v4() and any
-- auto-increment columns work correctly for both roles.

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================================================
-- 5. FUNCTION EXECUTE GRANTS
-- =============================================================================
-- Grant EXECUTE on all application functions so they can be called via
-- supabase.rpc() or triggered internally.

-- Helper / utility functions (00001)
GRANT EXECUTE ON FUNCTION public.update_updated_at_column()                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin()                                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_above()                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user()                            TO authenticated;

-- Search functions (00001 + 00003)
GRANT EXECUTE ON FUNCTION public.search_best_practices(vector, float, int)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_best_practices(vector, float, int, int, text, text[], text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_best_practices_count(vector, float, text, text[], text)     TO authenticated;

-- Gamification / user functions (00001 + 00007)
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int, int)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_field(text, uuid, text, int)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, int)                         TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_login_streak(uuid)                    TO authenticated;

-- Trigger functions (00001)
GRANT EXECUTE ON FUNCTION public.update_entity_comments_count()               TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_entity_upvotes_count()                TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_course_lessons_count()                TO authenticated;

-- Learn Hub trigger function (00004)
GRANT EXECUTE ON FUNCTION public.update_course_progress_on_lesson_complete()  TO authenticated;

-- Leaderboard for anon (public leaderboard page)
GRANT EXECUTE ON FUNCTION public.get_leaderboard(int, int)                    TO anon;

-- Search for anon (public search, if enabled)
GRANT EXECUTE ON FUNCTION public.search_best_practices(vector, float, int)    TO anon;
GRANT EXECUTE ON FUNCTION public.match_best_practices(vector, float, int, int, text, text[], text) TO anon;
GRANT EXECUTE ON FUNCTION public.match_best_practices_count(vector, float, text, text[], text)     TO anon;

-- =============================================================================
-- 6. DEFAULT PRIVILEGES FOR FUTURE OBJECTS
-- =============================================================================
-- Ensure any tables, sequences, or functions created in future migrations
-- automatically receive the correct GRANTs without needing a separate fix.

-- Tables: authenticated gets full CRUD, anon gets SELECT
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO anon;

-- Sequences: both roles get USAGE and SELECT
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- Functions: both roles get EXECUTE
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO anon;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- After applying this migration:
--   - 'authenticated' can perform SELECT/INSERT/UPDATE/DELETE on all 27 tables
--     (actual row access still governed by existing RLS policies)
--   - 'anon' can SELECT on public-facing tables only
--   - All sequences are accessible for UUID generation
--   - All functions are callable via supabase.rpc()
--   - Future tables/sequences/functions inherit these grants automatically
-- =============================================================================
