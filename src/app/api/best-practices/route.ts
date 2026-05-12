// =============================================================================
// Best Practices API
// GET  /api/best-practices - Liste mit Pagination und Filter
// POST /api/best-practices - Neuen Best Practice Eintrag erstellen (Auth)
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiValidationError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBestPracticeSchema,
  listBestPracticesQuerySchema,
} from "@/lib/validators/best-practice";
import { awardCommunityXP } from "@/lib/gamification/xp";
import type { PaginationMeta } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET - Liste der Best Practices
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryRaw = {
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      mine: searchParams.get("mine") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const parsed = listBestPracticesQuerySchema.safeParse(queryRaw);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { page, pageSize, category, status, mine, sort, search } =
      parsed.data;

    // Optionale Auth — fuer "mine"-Filter und Draft-Sichtbarkeit
    const auth = await requireAuth(req);
    const userId = !("response" in auth) ? auth.userId : null;
    const isAdmin = !("response" in auth) && (auth.role === "admin" || auth.role === "super_admin");

    const supabase = createAdminClient();

    let query = supabase
      .from("best_practices")
      .select(
        "id, title, excerpt, category, tags, status, upvotes_count, views_count, comments_count, created_at, author:profiles!best_practices_author_id_fkey(id, full_name, avatar_url, level)",
        { count: "exact" },
      );

    // RLS: nicht-authentifizierte Nutzer sehen nur published
    // authentifizierte Nutzer sehen published + eigene drafts (via RLS)
    // Expliziter Status-Filter falls angegeben
    // F04 Fix: non-admin darf nur eigene non-published Eintraege sehen
    if (status) {
      query = query.eq("status", status);
      if (status !== "published" && !isAdmin) {
        // Restrict to own entries — prevents service-role draft leak
        if (userId) {
          query = query.eq("author_id", userId);
        } else {
          // Unauthenticated + non-published filter → return empty (no user to scope to)
          query = query.eq("author_id", "00000000-0000-0000-0000-000000000000");
        }
      }
    } else if (!userId) {
      query = query.eq("status", "published");
    }

    // "mine"-Filter: nur eigene Eintraege
    if (mine && userId) {
      query = query.eq("author_id", userId);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    switch (sort) {
      case "most_upvoted":
        query = query.order("upvotes_count", { ascending: false });
        break;
      case "most_viewed":
        query = query.order("views_count", { ascending: false });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: items, error, count } = await query;

    if (error) {
      return apiInternalError(error.message);
    }

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    const meta: PaginationMeta = {
      page,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };

    return apiSuccess(items ?? [], 200, meta);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// POST - Neuen Best Practice Eintrag erstellen
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const body: unknown = await req.json();
    const parsed = createBestPracticeSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { title, summary, content, category, tags, status } = parsed.data;
    const supabase = createAdminClient();

    const { data: item, error } = await supabase
      .from("best_practices")
      .insert({
        author_id: auth.userId,
        title,
        excerpt: summary,
        content,
        category,
        tags,
        status,
      })
      .select(
        "*, author:profiles!best_practices_author_id_fkey(id, full_name, avatar_url, level)",
      )
      .single();

    if (error) {
      return apiInternalError(error.message);
    }

    // XP fuer veroeffentlichte Beitraege (fire-and-forget)
    if (status === "published") {
      awardCommunityXP(supabase, auth.userId, "POST_CREATED").catch(() => {});
    }

    return apiSuccess(item, 201);
  } catch {
    return apiInternalError();
  }
}
