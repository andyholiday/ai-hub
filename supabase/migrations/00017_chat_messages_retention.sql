-- =============================================================================
-- AI Hub - GDPR Retention Policy for ai_chat_messages
-- Version: 00017
-- Date: 2026-05-01
-- Description: Adds 90-day retention via expires_at computed column and a
--              cleanup function callable via pg_cron or manually.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add expires_at as a generated column (90 days after created_at)
-- ---------------------------------------------------------------------------
ALTER TABLE public.ai_chat_messages
  ADD COLUMN IF NOT EXISTS expires_at timestamptz
    GENERATED ALWAYS AS (created_at + INTERVAL '90 days') STORED;

-- ---------------------------------------------------------------------------
-- 2. Index for efficient cleanup queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_expires_at
  ON public.ai_chat_messages (expires_at);

-- ---------------------------------------------------------------------------
-- 3. Cleanup function (SECURITY DEFINER so it can run as migration owner)
--    Deletes all rows whose 90-day window has passed.
--    Call manually:  SELECT cleanup_expired_chat_messages();
--    Or schedule:    SELECT cron.schedule('cleanup-chat-msgs', '0 3 * * *',
--                      'SELECT cleanup_expired_chat_messages()');
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_expired_chat_messages()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.ai_chat_messages
  WHERE expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Grant to service role only (cron jobs run as service role)
REVOKE ALL ON FUNCTION public.cleanup_expired_chat_messages() FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. pg_cron schedule (no-op if pg_cron extension is not enabled)
--    Runs daily at 03:00 UTC. Wrapped in DO to avoid failure when pg_cron
--    is not installed.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'cleanup-expired-chat-messages',
      '0 3 * * *',
      'SELECT public.cleanup_expired_chat_messages()'
    );
  END IF;
END;
$$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
