-- =============================================================================
-- LR AI Hub - Vault API Key Encryption
-- Version: 00014
-- Date: 2026-04-30
-- Description: Migrates plaintext API keys in ai_providers.api_key_encrypted
--              into Supabase Vault (pgsodium). After migration, the column
--              stores a vault UUID instead of the raw key.
--
-- ADR-003: API-Key-Encryption fuer ai_providers mit Supabase Vault
-- Phase 0 Hardening — OWASP A02 Critical
-- =============================================================================

-- =============================================================================
-- BACKUP: Export plaintext keys BEFORE the migration into a temp table.
-- If the migration fails partway through, the originals can be restored.
-- The temp table lives for the duration of this session only.
-- =============================================================================
CREATE TEMP TABLE api_keys_backup AS
SELECT
    id,
    provider_key,
    api_key_encrypted AS plaintext_key,
    NOW() AS backed_up_at
FROM ai_providers
WHERE api_key_encrypted IS NOT NULL;

-- Verify backup (optional: can be removed after first successful run)
-- SELECT * FROM api_keys_backup;

-- =============================================================================
-- PREREQUISITE CHECK: pgsodium and supabase_vault must be active.
-- In Supabase Cloud projects both are enabled by default.
-- Uncomment if running against a local instance without auto-seed:
--   CREATE EXTENSION IF NOT EXISTS pgsodium WITH SCHEMA extensions;
--   CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;
-- =============================================================================

-- =============================================================================
-- STEP 1: Move existing plaintext keys into Vault, write UUID back to column.
-- The DO block iterates only rows whose api_key_encrypted is NOT already a
-- 36-character UUID (i.e., not yet migrated).
-- =============================================================================
DO $$
DECLARE
    r       RECORD;
    vault_id UUID;
BEGIN
    FOR r IN
        SELECT id, provider_key, api_key_encrypted
        FROM ai_providers
        WHERE api_key_encrypted IS NOT NULL
          AND api_key_encrypted !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'  -- not yet a UUID
    LOOP
        SELECT vault.create_secret(
            r.api_key_encrypted,
            'ai_provider_key_' || r.provider_key,
            'API key for AI provider: ' || r.provider_key
        ) INTO vault_id;

        UPDATE ai_providers
        SET api_key_encrypted = vault_id::TEXT
        WHERE id = r.id;
    END LOOP;
END;
$$;

-- =============================================================================
-- STEP 2: Create SECURITY DEFINER RPC function for server-side key retrieval.
-- Only the service role can call vault.decrypted_secrets; this function
-- encapsulates the JOIN and returns only the decrypted values.
-- The function intentionally returns no data for inactive providers.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_active_provider_keys()
RETURNS TABLE (provider_key TEXT, api_key TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
    SELECT
        p.provider_key,
        ds.decrypted_secret AS api_key
    FROM public.ai_providers p
    JOIN vault.decrypted_secrets ds
        ON ds.id = p.api_key_encrypted::UUID
    WHERE p.is_active = TRUE
      AND p.api_key_encrypted IS NOT NULL
      AND p.api_key_encrypted ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
$$;

-- Only service_role may call this function (anon/authenticated have no access)
REVOKE ALL ON FUNCTION public.get_active_provider_keys() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_active_provider_keys() FROM authenticated;
REVOKE ALL ON FUNCTION public.get_active_provider_keys() FROM anon;

-- =============================================================================
-- STEP 3: Create SECURITY DEFINER RPC for admin PUT — stores a new key in
-- Vault and returns the resulting UUID (caller writes UUID to the column).
-- =============================================================================
CREATE OR REPLACE FUNCTION public.upsert_provider_vault_key(
    p_provider_key TEXT,
    p_api_key      TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public
AS $$
DECLARE
    existing_uuid UUID;
    new_uuid      UUID;
BEGIN
    -- Check if a secret already exists for this provider
    SELECT id INTO existing_uuid
    FROM vault.secrets
    WHERE name = 'ai_provider_key_' || p_provider_key
    LIMIT 1;

    IF existing_uuid IS NOT NULL THEN
        -- Update the existing secret in-place
        PERFORM vault.update_secret(existing_uuid, p_api_key);
        RETURN existing_uuid;
    ELSE
        -- Create a new secret
        SELECT vault.create_secret(
            p_api_key,
            'ai_provider_key_' || p_provider_key,
            'API key for AI provider: ' || p_provider_key
        ) INTO new_uuid;
        RETURN new_uuid;
    END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_provider_vault_key(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_provider_vault_key(TEXT, TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION public.upsert_provider_vault_key(TEXT, TEXT) FROM anon;

-- =============================================================================
-- VERIFICATION (run manually after applying):
-- All rows should now have 36-char UUIDs in api_key_encrypted:
--   SELECT id, provider_key, length(api_key_encrypted) AS key_len
--   FROM ai_providers;
-- =============================================================================

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
