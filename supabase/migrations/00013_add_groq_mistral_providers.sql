-- =============================================================================
-- Migration 00013: Add Groq and Mistral AI Providers
-- Adds two new AI providers to the ai_providers table
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Insert Groq Provider
-- ---------------------------------------------------------------------------
INSERT INTO ai_providers (
    provider_key,
    display_name,
    api_endpoint,
    model,
    temperature,
    max_tokens,
    top_p,
    is_active,
    is_primary
) VALUES (
    'groq',
    'Groq',
    'https://api.groq.com/openai/v1/chat/completions',
    'llama-3.3-70b-versatile',
    0.70,
    8192,
    1.00,
    false,
    false
) ON CONFLICT (provider_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Insert Mistral Provider
-- ---------------------------------------------------------------------------
INSERT INTO ai_providers (
    provider_key,
    display_name,
    api_endpoint,
    model,
    temperature,
    max_tokens,
    top_p,
    is_active,
    is_primary
) VALUES (
    'mistral',
    'Mistral AI',
    'https://api.mistral.ai/v1/chat/completions',
    'mistral-large-latest',
    0.70,
    8192,
    1.00,
    false,
    false
) ON CONFLICT (provider_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Grant access to service_role (consistent with 00008)
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_providers TO service_role;
