// =============================================================================
// Provider Management API
// GET  /api/admin/providers  - List all AI providers
// PUT  /api/admin/providers  - Update a provider's configuration
// =============================================================================

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
  apiNotFound,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProviderSchema } from "@/lib/validators/admin";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Safely mask an API key – never reveal more than the first 4 chars. */
function maskApiKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length < 8) return "********";
  return `${key.slice(0, 4)}...${"*".repeat(8)}`;
}

// ---------------------------------------------------------------------------
// GET - List all providers
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;

    const supabase = createAdminClient();

    const { data: providers, error } = await supabase
      .from("ai_providers")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      return apiInternalError(error.message);
    }

    // Mask api_key_encrypted for the response - never send raw keys to the client
    const safeProviders = (providers ?? []).map((p) => ({
      ...p,
      api_key_encrypted: maskApiKey(p.api_key_encrypted),
    }));

    return apiSuccess(safeProviders);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// PUT - Update provider configuration
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;

    const body: unknown = await req.json();
    const parsed = updateProviderSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { id, ...updates } = parsed.data;
    const supabase = createAdminClient();

    // If setting as primary, unset any existing primary provider first
    if (updates.is_primary === true) {
      await supabase
        .from("ai_providers")
        .update({ is_primary: false })
        .eq("is_primary", true)
        .neq("id", id);
    }

    const { data: provider, error } = await supabase
      .from("ai_providers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return apiNotFound("Provider not found");
      }
      return apiInternalError(error.message);
    }

    // Mask the key before returning
    return apiSuccess({
      ...provider,
      api_key_encrypted: maskApiKey(provider.api_key_encrypted),
    });
  } catch {
    return apiInternalError();
  }
}
