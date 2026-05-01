-- =============================================================================
-- AI Hub - GDPR Retention Policy for ai_chat_messages
-- Version: 00017
-- Date: 2026-05-01
-- Description: Adds 90-day retention via time-based WHERE filter in a cleanup
--              function callable via pg_cron or manually.
-- Note: Generated column approach dropped — INTERVAL is not immutable in
--       Postgres and cannot be used in GENERATED ALWAYS AS ... STORED.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Index on created_at for efficient cleanup queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at
  ON public.ai_chat_messages (created_at);

-- ---------------------------------------------------------------------------
-- 2. Cleanup function (SECURITY DEFINER so it can run as migration owner)
--    Deletes all rows older than 90 days.
--    Call manually:  SELECT cleanup_expired_chat_messages();
--    Or schedule:    SELECT cron.schedule('cleanup-chat-msgs', '0 3 * * *',
--                      'SELECT cleanup_expired_chat_messages()');
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_expired_chat_messages()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
    WITH deleted AS (
        DELETE FROM ai_chat_messages
        WHERE created_at < now() - INTERVAL '90 days'
        RETURNING 1
    )
    SELECT count(*) FROM deleted;
$$;

-- Grant to service role only (cron jobs run as service role)
REVOKE ALL ON FUNCTION public.cleanup_expired_chat_messages() FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. pg_cron schedule (no-op if pg_cron extension is not enabled)
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
