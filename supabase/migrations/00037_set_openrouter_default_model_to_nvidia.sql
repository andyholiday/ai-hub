-- =============================================================================
-- AI Hub - Set OpenRouter default model to a free Nvidia Nemotron
-- Version: 00037
-- Date: 2026-05-25
-- Description: Migration 00030 seeded the OpenRouter row with
--              'openai/gpt-4o-mini' as the default model. That model is
--              paid-tier on OpenRouter and would burn through Andre's free
--              credit on the first request. Switch to the free Nvidia
--              Nemotron Nano 9B v2 model (128k context, streaming,
--              prompt/completion $0/1M tokens on OpenRouter as of 2026-05-25).
--
--              Idempotent: only updates the row when it still carries the
--              old gpt-4o-mini default; leaves manually-customised values
--              alone.
-- =============================================================================

UPDATE public.ai_providers
SET model = 'nvidia/nemotron-nano-9b-v2:free'
WHERE provider_key = 'openrouter'
  AND model = 'openai/gpt-4o-mini';
