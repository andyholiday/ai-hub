// =============================================================================
// Single Best Practice API
// GET    /api/best-practices/[id] - Detail
// PATCH  /api/best-practices/[id] - Update (Owner oder Admin)
// DELETE /api/best-practices/[id] - Loeschen (Owner oder Admin)
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiNotFound,
  apiValidationError,
  apiError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateBestPracticeSchema } from "@/lib/validators/best-practice";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Route params type
// ---------------------------------------------------------------------------

interface RouteParams {
  params: { id: string };
}

// ---------------------------------------------------------------------------
// GET - Detail
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;

    const supabase = createAdminClient();

    // Optionale Auth
    const auth = await requireAuth(req);
    const userId = !("response" in auth) ? auth.userId : null;

    const { data: item, error } = await supabase
      .from("best_practices")
      .select(
        "*, author:profiles!best_practices_author_id_fkey(id, full_name, avatar_url, level)",
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return apiNotFound("Best Practice nicht gefunden");
      }
      return apiInternalError(error.message);
    }

    // Nicht-Owner duerfen nur published sehen
    const isOwner = userId === item.author_id;
    if (item.status !== "published" && !isOwner) {
      return apiNotFound("Best Practice nicht gefunden");
    }

    // View-Count erhoehen (fire-and-forget)
    supabase
      .from("best_practices")
      .update({ views_count: item.views_count + 1 })
      .eq("id", id)
      .then();

    return apiSuccess(item);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// PATCH - Update (Owner oder Admin)
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { id } = params;
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("best_practices")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return apiNotFound("Best Practice nicht gefunden");
    }

    const isOwner = existing.author_id === auth.userId;
    const isAdmin = auth.role === "admin" || auth.role === "super_admin";

    if (!isOwner && !isAdmin) {
      return apiError(
        "FORBIDDEN",
        "Keine Berechtigung zum Bearbeiten dieses Eintrags",
        403,
      );
    }

    const body: unknown = await req.json();
    const parsed = updateBestPracticeSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    // Mapping: summary -> excerpt (DB-Spaltenname)
    const { summary, ...rest } = parsed.data;
    const updatePayload = {
      ...rest,
      ...(summary !== undefined ? { excerpt: summary } : {}),
    };

    const { data: updated, error } = await supabase
      .from("best_practices")
      .update(updatePayload)
      .eq("id", id)
      .select(
        "*, author:profiles!best_practices_author_id_fkey(id, full_name, avatar_url, level)",
      )
      .single();

    if (error) {
      return apiInternalError(error.message);
    }

    return apiSuccess(updated);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// DELETE - Loeschen (Owner oder Admin)
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { id } = params;
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("best_practices")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return apiNotFound("Best Practice nicht gefunden");
    }

    const isOwner = existing.author_id === auth.userId;
    const isAdmin = auth.role === "admin" || auth.role === "super_admin";

    if (!isOwner && !isAdmin) {
      return apiError(
        "FORBIDDEN",
        "Keine Berechtigung zum Loeschen dieses Eintrags",
        403,
      );
    }

    const { error } = await supabase
      .from("best_practices")
      .delete()
      .eq("id", id);

    if (error) {
      return apiInternalError(error.message);
    }

    return apiSuccess({ deleted: true });
  } catch {
    return apiInternalError();
  }
}
