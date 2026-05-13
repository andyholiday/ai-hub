-- =============================================================================
-- Migration: Lock Mentor Signal RPCs to auth.uid()
-- Version: 00027
-- Date: 2026-05-12
-- Description: Closes IDOR gap on two SECURITY DEFINER RPCs (AUDIT-2026-05-12 Task 4).
--
--              get_mentor_signals filtered only on p_user_id without validating
--              that p_user_id == auth.uid(). An authenticated caller could supply
--              any UUID and read another user's unread signals.
--
--              generate_page_briefing had the same problem: it used p_user_id
--              for the INSERT and profile lookup without checking auth.uid().
--
--              Fix: Both functions now add  AND p_user_id = auth.uid()  so the
--              caller's JWT identity is enforced even inside SECURITY DEFINER.
--              The function signatures remain unchanged so existing callers
--              (src/app/api/mentor/signals/route.ts) are unaffected.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- get_mentor_signals — add auth.uid() guard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_mentor_signals(
  p_user_id uuid,
  p_page_context text DEFAULT NULL,
  p_limit integer DEFAULT 10
)
RETURNS SETOF public.mentor_signals
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.mentor_signals
  WHERE user_id = auth.uid()         -- RLS-equivalent guard
    AND p_user_id = auth.uid()       -- caller-supplied ID must match session
    AND is_read = false
    AND is_dismissed = false
    AND (expires_at IS NULL OR expires_at > now())
    AND (p_page_context IS NULL OR page_context = p_page_context)
  ORDER BY priority DESC, created_at DESC
  LIMIT p_limit;
$$;

-- Preserve the existing execute grant
GRANT EXECUTE ON FUNCTION public.get_mentor_signals(uuid, text, integer) TO authenticated;

-- ---------------------------------------------------------------------------
-- generate_page_briefing — add auth.uid() guard
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_page_briefing(
  p_user_id uuid,
  p_page_context text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_signal_id uuid;
  v_profile   record;
  v_content   text;
  v_title     text;
BEGIN
  -- Enforce that caller can only generate briefings for themselves
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'generate_page_briefing: p_user_id must match authenticated user'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Get user profile data
  SELECT p.full_name, p.xp, p.level, p.streak_days
  INTO v_profile
  FROM public.profiles p
  WHERE p.id = auth.uid();

  -- Generate context-specific briefing
  CASE p_page_context
    WHEN 'dashboard' THEN
      v_title   := 'Willkommen zurück!';
      v_content := format(
        'Hey %s! Du bist auf einer %s-Tage-Streak Dein Level: %s mit %s XP.',
        COALESCE(split_part(v_profile.full_name, ' ', 1), 'du'),
        COALESCE(v_profile.streak_days, 0),
        COALESCE(v_profile.level, 1),
        COALESCE(v_profile.xp, 0)
      );
    WHEN 'learn-hub' THEN
      v_title   := 'Lernfortschritt';
      v_content := format(
        'Hey %s! Schau dir deine aktiven Kurse an. Nur noch wenige Lektionen bis zum Abschluss!',
        COALESCE(split_part(v_profile.full_name, ' ', 1), 'du')
      );
    WHEN 'community' THEN
      v_title   := 'Community Update';
      v_content := 'Es gibt neue Diskussionen in der Community. Schau rein und teile dein Wissen!';
    WHEN 'challenges' THEN
      v_title   := 'Challenges warten!';
      v_content := 'Neue Challenges stehen bereit. Schliesse eine ab und sammle XP!';
    ELSE
      v_title   := 'AI Mentor Tipp';
      v_content := 'Brauchst du Hilfe? Klick mich an!';
  END CASE;

  -- Skip if a similar briefing was already shown recently (last 30 min)
  IF EXISTS (
    SELECT 1 FROM public.mentor_signals
    WHERE user_id    = auth.uid()
      AND page_context = p_page_context
      AND signal_type  = 'page_entry_briefing'
      AND created_at   > now() - INTERVAL '30 minutes'
  ) THEN
    RETURN NULL;
  END IF;

  -- Insert the briefing signal for the authenticated user only
  INSERT INTO public.mentor_signals
    (user_id, signal_type, page_context, title, content, priority, expires_at)
  VALUES
    (auth.uid(), 'page_entry_briefing', p_page_context, v_title, v_content, 7,
     now() + INTERVAL '30 minutes')
  RETURNING id INTO v_signal_id;

  RETURN v_signal_id;
END;
$$;

-- Preserve the existing execute grant
GRANT EXECUTE ON FUNCTION public.generate_page_briefing(uuid, text) TO authenticated;

-- Smoke check (run in Supabase SQL editor after apply):
-- As user A, calling get_mentor_signals with user B's UUID should return 0 rows.
-- SELECT count(*) FROM get_mentor_signals('<user-b-uuid>');  -- expected: 0
-- SELECT generate_page_briefing('<user-b-uuid>', 'dashboard');  -- expected: exception

COMMIT;
