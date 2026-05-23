-- Migration 00030: Add 'openrouter' to known AI providers
--
-- Why: OpenRouter is an aggregator that exposes many models via an OpenAI-API
-- compatible endpoint. Adding it as a known provider lets admins configure
-- an OpenRouter API key in the existing Admin-Panel and use it as a fallback
-- when other providers (e.g. Gemini free tier) are quota-limited.
--
-- Reverse: drop the constraint, recreate without 'openrouter', remove the row.

BEGIN;

ALTER TABLE public.ai_providers
  DROP CONSTRAINT IF EXISTS ai_providers_provider_key_known;

ALTER TABLE public.ai_providers
  ADD CONSTRAINT ai_providers_provider_key_known
  CHECK (provider_key = ANY (ARRAY[
    'openai'::text,
    'claude'::text,
    'copilot'::text,
    'gemini'::text,
    'groq'::text,
    'mistral'::text,
    'openrouter'::text
  ]));

INSERT INTO public.ai_providers (
  provider_key,
  display_name,
  api_endpoint,
  model,
  temperature,
  max_tokens,
  top_p,
  is_active,
  is_primary
)
VALUES (
  'openrouter',
  'OpenRouter',
  'https://openrouter.ai/api/v1/chat/completions',
  'openai/gpt-4o-mini',
  0.7,
  4096,
  1.0,
  false,
  false
)
ON CONFLICT (provider_key) DO NOTHING;

COMMIT;
