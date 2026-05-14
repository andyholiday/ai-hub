-- =============================================================================
-- XP Audit Log + Idempotency
-- Tracks every XP award; enforces idempotency for actions with idempotency_key
--
-- NOTE: This project uses uuid-ossp (uuid_generate_v4) as activated in
-- 00001_initial_schema.sql. gen_random_uuid() (pgcrypto) is NOT used.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.xp_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  idempotency_key text,
  awarded_at timestamptz NOT NULL DEFAULT now()
);

-- Unique partial index: when idempotency_key is provided, it must be unique
-- per (user, action). Allows double-fire-with-key prevention while letting
-- key-less awards (legacy) still pass through.
CREATE UNIQUE INDEX IF NOT EXISTS xp_log_idempotency_unique
  ON public.xp_log (user_id, action, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS xp_log_user_awarded_idx
  ON public.xp_log (user_id, awarded_at DESC);

ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own xp_log" ON public.xp_log;
CREATE POLICY "users read own xp_log"
  ON public.xp_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "service_role inserts xp_log" ON public.xp_log;
CREATE POLICY "service_role inserts xp_log"
  ON public.xp_log FOR INSERT
  TO service_role
  WITH CHECK (true);
