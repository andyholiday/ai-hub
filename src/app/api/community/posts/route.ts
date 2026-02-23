// =============================================================================
// Community Posts API
// GET  /api/community/posts - List posts with pagination, filter, sort
// POST /api/community/posts - Create a new post (auth required)
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
  createPostSchema,
  listPostsQuerySchema,
} from "@/lib/validators/community";
import { awardCommunityXP } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievements";
import type { PaginationMeta } from "@/types/api";

// ---------------------------------------------------------------------------
// GET - List community posts
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryRaw = {
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    };

    const parsed = listPostsQuerySchema.safeParse(queryRaw);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { page, pageSize, type, tag, sort, search } = parsed.data;

    // Optionally authenticate to check upvote status
    const auth = await requireAuth(req);
    const userId = !("response" in auth) ? auth.userId : null;

    const supabase = createAdminClient();

    // Build query
    // Select only the fields needed for the list view to reduce payload size.
    // The full content is trimmed on the client (line-clamp-2) so we still
    // include it, but exclude internal columns like updated_at, author_id etc.
    let query = supabase
      .from("community_posts")
      .select(
        "id, title, content, type, tags, upvotes_count, comments_count, views_count, is_pinned, created_at, author:profiles!community_posts_author_id_fkey(id, full_name, avatar_url, level)",
        { count: "exact" },
      );

    // Filters
    if (type) {
      query = query.eq("type", type);
    }

    if (tag) {
      query = query.contains("tags", [tag]);
    }

    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    // Sorting
    switch (sort) {
      case "most_upvoted":
        query = query.order("upvotes_count", { ascending: false });
        break;
      case "most_viewed":
        query = query.order("views_count", { ascending: false });
        break;
      case "newest":
      default:
        query = query
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });
        break;
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data: posts, error, count } = await query;

    if (error) {
      return apiInternalError(error.message);
    }

    // Check which posts the user has upvoted
    let upvotedPostIds = new Set<string>();
    if (userId && posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const { data: upvotes } = await supabase
        .from("upvotes")
        .select("entity_id")
        .eq("user_id", userId)
        .eq("entity_type", "community_post")
        .in("entity_id", postIds);

      upvotedPostIds = new Set(
        (upvotes ?? []).map((u) => u.entity_id),
      );
    }

    const enrichedPosts = (posts ?? []).map((post) => ({
      ...post,
      hasUpvoted: upvotedPostIds.has(post.id),
    }));

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

    return apiSuccess(enrichedPosts, 200, meta);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// POST - Create a new community post
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const body: unknown = await req.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { title, content, type, tags } = parsed.data;
    const supabase = createAdminClient();

    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        author_id: auth.userId,
        title,
        content,
        type,
        tags,
      })
      .select(
        "*, author:profiles!community_posts_author_id_fkey(id, full_name, avatar_url, level)",
      )
      .single();

    if (error) {
      return apiInternalError(error.message);
    }

    // Award XP for post creation (fire-and-forget)
    awardCommunityXP(supabase, auth.userId, "POST_CREATED").then(() => {
      checkAndAwardBadges(supabase, auth.userId);
      checkAndUnlockAchievements(supabase, auth.userId).catch(() => {});
    });

    return apiSuccess({ ...post, hasUpvoted: false }, 201);
  } catch {
    return apiInternalError();
  }
}
