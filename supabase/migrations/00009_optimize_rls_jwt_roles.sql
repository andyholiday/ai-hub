-- =============================================================================
-- Migration: Optimize RLS Functions to Use JWT Claims
-- Version: 00009
-- Date: 2026-02-21
-- Description: Eliminates per-query profile lookups in RLS policies by reading
--   the user role from JWT app_metadata instead of querying the profiles table.
--   Also creates a consolidated get_user_profile_data() function to replace
--   multiple sequential queries in the Profile API, and an optimized
--   get_leaderboard_with_stats() function.
--
-- PREREQUISITE: User roles must be synced to auth.users.raw_app_meta_data
--   via the sync_role_to_jwt() trigger (created in this migration).
-- =============================================================================

-- =============================================================================
-- 1. TRIGGER: Sync profile role changes to JWT app_metadata
-- =============================================================================

-- This trigger fires whenever a profile's role is updated.
-- It writes the role into auth.users.raw_app_meta_data so the JWT
-- will contain the role on the next token refresh.
CREATE OR REPLACE FUNCTION sync_role_to_jwt()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        UPDATE auth.users
        SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', NEW.role::text)
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists, then create
DROP TRIGGER IF EXISTS on_profile_role_change ON profiles;
CREATE TRIGGER on_profile_role_change
    AFTER UPDATE OF role ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_role_to_jwt();

-- =============================================================================
-- 2. BACKFILL: Sync all existing roles to JWT app_metadata
-- =============================================================================

-- One-time migration: write current roles into auth.users.raw_app_meta_data
UPDATE auth.users u
SET raw_app_meta_data = u.raw_app_meta_data || jsonb_build_object('role', p.role::text)
FROM profiles p
WHERE u.id = p.id;

-- =============================================================================
-- 3. ALSO SYNC ROLE ON PROFILE CREATION (new user signup)
-- =============================================================================

-- Update the existing handle_new_user() to also set role in app_metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name',
        NEW.raw_user_meta_data ->> 'avatar_url'
    );

    -- Set default role in JWT app_metadata
    UPDATE auth.users
    SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'user')
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. OPTIMIZED RLS HELPER FUNCTIONS (JWT-based, zero DB queries)
-- =============================================================================

-- Replace is_admin() - reads role from JWT instead of querying profiles table
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role',
        ''
    ) IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Replace is_moderator_or_above() - reads role from JWT instead of querying profiles table
CREATE OR REPLACE FUNCTION is_moderator_or_above()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role',
        ''
    ) IN ('moderator', 'admin', 'super_admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- 5. CONSOLIDATED PROFILE DATA FUNCTION
-- =============================================================================

-- Replaces 4-5 sequential queries in the Profile API with a single DB call.
-- Returns profile, badges with definitions, and stats in one round-trip.
CREATE OR REPLACE FUNCTION get_user_profile_data(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'profile', (
            SELECT row_to_json(p.*)
            FROM profiles p
            WHERE p.id = target_user_id
        ),
        'badges', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'id', b.id,
                    'key', b.key,
                    'name', b.name,
                    'description', b.description,
                    'icon', b.icon,
                    'category', b.category,
                    'xp_threshold', b.xp_threshold,
                    'condition', b.condition,
                    'created_at', b.created_at,
                    'earned_at', ub.earned_at
                )
            )
            FROM user_badges ub
            JOIN badges b ON b.id = ub.badge_id
            WHERE ub.user_id = target_user_id
        ), '[]'::json),
        'stats', json_build_object(
            'postsCount', (
                SELECT COUNT(*)
                FROM community_posts
                WHERE author_id = target_user_id
            ),
            'coursesCompleted', (
                SELECT COUNT(*)
                FROM user_course_progress
                WHERE user_id = target_user_id
                AND completed_at IS NOT NULL
            )
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- 6. OPTIMIZED LEADERBOARD FUNCTION
-- =============================================================================

-- Replaces 2-4 queries in the Leaderboard API with a single function call.
-- Returns entries + total active users + current user rank in one round-trip.
CREATE OR REPLACE FUNCTION get_leaderboard_optimized(
    current_user_id UUID DEFAULT NULL,
    limit_count INT DEFAULT 20
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    capped_limit INT;
BEGIN
    capped_limit := LEAST(limit_count, 50);

    SELECT json_build_object(
        'entries', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'rank', sub.rank,
                    'id', sub.id,
                    'name', COALESCE(sub.full_name, 'Unbekannt'),
                    'avatarUrl', sub.avatar_url,
                    'department', sub.department,
                    'level', COALESCE(sub.level, 1),
                    'xp', COALESCE(sub.xp, 0),
                    'isCurrentUser', (current_user_id IS NOT NULL AND sub.id = current_user_id)
                )
            )
            FROM (
                SELECT
                    p.id,
                    p.full_name,
                    p.avatar_url,
                    p.department,
                    p.level,
                    p.xp,
                    ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.created_at ASC) AS rank
                FROM profiles p
                ORDER BY p.xp DESC, p.created_at ASC
                LIMIT capped_limit
            ) sub
        ), '[]'::json),
        'totalActiveUsers', (
            SELECT COUNT(*) FROM profiles WHERE xp > 0
        ),
        'currentUserRank', (
            CASE WHEN current_user_id IS NOT NULL THEN (
                SELECT COUNT(*) + 1
                FROM profiles
                WHERE xp > COALESCE((SELECT xp FROM profiles WHERE id = current_user_id), 0)
            ) ELSE NULL END
        ),
        'currentUserXp', (
            CASE WHEN current_user_id IS NOT NULL THEN (
                SELECT COALESCE(xp, 0) FROM profiles WHERE id = current_user_id
            ) ELSE NULL END
        ),
        'currentUserLevel', (
            CASE WHEN current_user_id IS NOT NULL THEN (
                SELECT COALESCE(level, 1) FROM profiles WHERE id = current_user_id
            ) ELSE NULL END
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- 7. GRANT EXECUTE ON NEW FUNCTIONS
-- =============================================================================
-- These functions were created in this migration and need explicit EXECUTE
-- grants so they can be called via supabase.rpc() by authenticated users.
-- Note: is_admin() and is_moderator_or_above() already have GRANTs from
-- migration 00008_fix_grants.sql. handle_new_user() is a trigger function
-- called by the system, not via rpc(), so its existing GRANT suffices.

GRANT EXECUTE ON FUNCTION sync_role_to_jwt() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_leaderboard_optimized(uuid, int) TO authenticated;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
