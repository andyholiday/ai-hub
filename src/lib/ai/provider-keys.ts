// =============================================================================
// Provider API Keys from Database
// Reads api_key_encrypted from ai_providers table with in-memory caching
// =============================================================================

import { createAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Maps provider_key (e.g. "gemini", "openai") to its API key string. */
export type ProviderKeyMap = Record<string, string>;

// ---------------------------------------------------------------------------
// In-Memory Cache (60s TTL)
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: ProviderKeyMap;
  expiresAt: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds

let cache: CacheEntry | null = null;

/**
 * Invalidate the cached provider keys.
 * Useful after an admin updates a key via the dashboard.
 */
export function invalidateProviderKeyCache(): void {
  cache = null;
}

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Fetch all API keys from the `ai_providers` table.
 *
 * Returns a `Record<string, string>` where the key is `provider_key`
 * (e.g. "gemini", "claude", "openai") and the value is the raw
 * `api_key_encrypted` column value.
 *
 * Results are cached in-memory for 60 seconds to minimise DB round-trips.
 * Only active providers with a non-empty key are included.
 */
export async function getProviderApiKeysFromDB(): Promise<ProviderKeyMap> {
  // Return cached data if still valid
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const supabase = createAdminClient();

  const { data: providers, error } = await supabase
    .from("ai_providers")
    .select("provider_key, api_key_encrypted, is_active")
    .eq("is_active", true);

  if (error) {
    console.error(
      "[provider-keys] Failed to fetch API keys from DB:",
      error.message,
    );
    // On error, return stale cache if available, otherwise empty map
    return cache?.data ?? {};
  }

  const keyMap: ProviderKeyMap = {};

  for (const row of providers ?? []) {
    if (row.provider_key && row.api_key_encrypted) {
      keyMap[row.provider_key] = row.api_key_encrypted;
    }
  }

  // Update cache
  cache = {
    data: keyMap,
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return keyMap;
}
