-- =============================================================================
-- Migration 00029: Normalize chatgpt -> openai provider key
-- Date: 2026-05-13
-- Description: The ai_providers table contains a legacy row with provider_key
--              'chatgpt' (is_active: false). This migration renames it to
--              'openai' and adds a CHECK constraint to lock down the allowed
--              provider_key values for future inserts/updates.
-- =============================================================================

BEGIN;

-- Step 1: Rename chatgpt row to openai.
-- display_name is updated only if it still reflects a chatgpt-specific label.
-- COALESCE: CASE returns 'OpenAI' on chatgpt-match else NULL; NULL falls back
-- to display_name (no-op) — preserves admin-customized labels untouched.
UPDATE public.ai_providers
SET
  provider_key = 'openai',
  display_name = COALESCE(
    CASE WHEN lower(display_name) LIKE '%chatgpt%' THEN 'OpenAI' ELSE NULL END,
    display_name
  )
WHERE provider_key = 'chatgpt';

-- Step 2: Add CHECK constraint to restrict provider_key to known values.
-- Drop first in case a previous attempt left a partial constraint.
ALTER TABLE public.ai_providers
  DROP CONSTRAINT IF EXISTS ai_providers_provider_key_known;

ALTER TABLE public.ai_providers
  ADD CONSTRAINT ai_providers_provider_key_known
  CHECK (provider_key IN ('openai', 'claude', 'copilot', 'gemini', 'groq', 'mistral'));

COMMIT;
