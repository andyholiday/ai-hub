-- =============================================================================
-- Migration: Lock Profile Role/XP/Level Updates
-- Version: 00025
-- Date: 2026-05-12
-- Description: Closes privilege-escalation gap (AUDIT-2026-05-12 Task 2).
--              The old "profiles_update_own" policy had no WITH CHECK constraint,
--              allowing authenticated users to self-assign any role, XP or level.
--
--              Fix:
--              1. Drop the old broad policy.
--              2. Add column-level UPDATE grant — authenticated can only write
--                 safe profile fields (full_name, username, avatar_url, department,
--                 bio, preferences, onboarding_completed).
--              3. Add two targeted policies:
--                 - profiles_update_safe_own  (user updates own safe fields only)
--                 - profiles_update_admin     (admin can update anything)
--
--              service_role keeps its existing superuser bypass and is never
--              affected by RLS policies or column-level grants in Supabase.
-- =============================================================================

BEGIN;

-- 1. Remove the old overly-permissive policy (idempotent).
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- 2. Column-level UPDATE grant: authenticated users may only write these fields.
--    role, xp, level, streak_days, etc. are intentionally excluded.
REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (
  full_name,
  username,
  avatar_url,
  department,
  bio,
  preferences,
  onboarding_completed
) ON public.profiles TO authenticated;

-- 3a. Policy: user may update their own row, but the WITH CHECK enforces that
--     role, xp and level cannot be changed (they must equal the current DB values).
--     The column-level grant above means even if this policy passed, the DB would
--     reject writes to those columns — defense in depth.
DROP POLICY IF EXISTS "profiles_update_safe_own" ON public.profiles;

CREATE POLICY "profiles_update_safe_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role  = (SELECT role  FROM public.profiles WHERE id = auth.uid())
    AND xp    = (SELECT xp    FROM public.profiles WHERE id = auth.uid())
    AND level = (SELECT level FROM public.profiles WHERE id = auth.uid())
  );

-- 3b. Policy: admins may update any profile row without the field restrictions.
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

CREATE POLICY "profiles_update_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Smoke check (run in Supabase SQL editor to verify after apply):
-- SELECT column_name, privilege_type
-- FROM information_schema.column_privileges
-- WHERE table_name = 'profiles'
--   AND grantee = 'authenticated'
--   AND privilege_type = 'UPDATE';
-- Expected: only the 7 safe columns above.

COMMIT;
