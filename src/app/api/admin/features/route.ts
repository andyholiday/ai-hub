// =============================================================================
// Feature Toggles API
// GET /api/admin/features - List all feature flags
// PUT /api/admin/features - Toggle a feature flag
// =============================================================================

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/api/admin-auth";
import {
  apiSuccess,
  apiInternalError,
  apiNotFound,
  apiValidationError,
} from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateFeatureSchema } from "@/lib/validators/admin";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET - List all feature flags
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;

    const rl = await rateLimit(req, "admin", auth.userId);
    if (!rl.success) {
      return new Response(JSON.stringify({ data: null, error: { code: "RATE_LIMITED", message: "Too many requests" } }), { status: 429 });
    }

    const supabase = createAdminClient();

    const { data: features, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return apiInternalError(error.message);
    }

    return apiSuccess(features ?? []);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// PUT - Toggle a feature flag
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("response" in auth) return auth.response;

    const rl = await rateLimit(req, "admin", auth.userId);
    if (!rl.success) {
      return new Response(JSON.stringify({ data: null, error: { code: "RATE_LIMITED", message: "Too many requests" } }), { status: 429 });
    }

    const body: unknown = await req.json();
    const parsed = updateFeatureSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { id, enabled } = parsed.data;
    const supabase = createAdminClient();

    const { data: feature, error } = await supabase
      .from("feature_flags")
      .update({
        enabled,
        updated_by: auth.userId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return apiNotFound("Feature flag not found");
      }
      return apiInternalError(error.message);
    }

    return apiSuccess(feature);
  } catch {
    return apiInternalError();
  }
}
