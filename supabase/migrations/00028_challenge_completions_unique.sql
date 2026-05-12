-- =============================================================================
-- Migration 00028: challenge_completions — one-time XP guard (Task 11)
--
-- Ensures XP is awarded at most once per user per challenge.
-- The PRIMARY KEY (user_id, challenge_id) is the unique constraint.
-- Route handler uses upsert with ignoreDuplicates=true; 0 rows inserted → skip XP.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.challenge_completions (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  xp_awarded   int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, challenge_id)
);

ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own_completions" ON public.challenge_completions;

CREATE POLICY "own_completions"
  ON public.challenge_completions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
