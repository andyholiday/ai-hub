// =============================================================================
// Innovation Radar API
// GET /api/innovation-radar - List radar items with filters and sorting
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { listRadarItemsQuerySchema } from "@/lib/validators/innovation-radar";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET - List innovation radar items
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    // Auth required
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { searchParams } = new URL(req.url);
    const queryRaw = {
      category: searchParams.get("category") ?? undefined,
      ring: searchParams.get("ring") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
    };

    const parsed = listRadarItemsQuerySchema.safeParse(queryRaw);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { category, ring, search, sort } = parsed.data;

    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from("innovation_radar_items")
      .select("*");

    // Filters
    if (category) {
      query = query.eq("category", category);
    }

    if (ring) {
      query = query.eq("ring", ring);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // Sorting
    switch (sort) {
      case "most_voted":
        query = query
          .order("votes_count", { ascending: false })
          .order("created_at", { ascending: false });
        break;
      case "title":
        query = query.order("title", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data: items, error } = await query;

    if (error) {
      return apiInternalError(error.message);
    }

    // Note: The upvotes table currently does not support
    // "innovation_radar_item" as entity_type. We derive the voted
    // status from the item's added_by field for now (user who added it).
    const enrichedItems = (items ?? []).map((item) => ({
      ...item,
      isVotedByUser: item.added_by === auth.userId,
    }));

    return apiSuccess(enrichedItems);
  } catch {
    return apiInternalError();
  }
}
