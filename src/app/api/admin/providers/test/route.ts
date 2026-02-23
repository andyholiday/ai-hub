// =============================================================================
// Provider Health Check API
// POST /api/admin/providers/test - Test if a provider is reachable
// =============================================================================

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  apiSuccess,
  apiInternalError,
  apiNotFound,
  apiValidationError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { testProviderSchema } from "@/lib/validators/admin";
import { getAIRouter } from "@/lib/ai/router";
import type { AIProvider } from "@/lib/ai/types";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST - Test provider connectivity
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;

    const body: unknown = await req.json();
    const parsed = testProviderSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { id } = parsed.data;
    const supabase = createAdminClient();

    // Fetch the provider record
    const { data: provider, error } = await supabase
      .from("ai_providers")
      .select("provider_key, display_name, is_active")
      .eq("id", id)
      .single();

    if (error || !provider) {
      return apiNotFound("Provider not found");
    }

    // Use the AI Router to check availability
    const router = getAIRouter();
    const startMs = Date.now();

    let available = false;
    let errorMessage: string | null = null;

    try {
      const resolved = await router.resolveProvider(
        provider.provider_key as AIProvider,
      );
      available = resolved.provider === provider.provider_key;
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : "Unknown error";
    }

    const latencyMs = Date.now() - startMs;

    return apiSuccess({
      provider_key: provider.provider_key,
      display_name: provider.display_name,
      available,
      latency_ms: latencyMs,
      error: errorMessage,
      tested_at: new Date().toISOString(),
    });
  } catch {
    return apiInternalError();
  }
}
