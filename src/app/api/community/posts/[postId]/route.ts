// =============================================================================
// Single Community Post API
// GET    /api/community/posts/[postId] - Get post with comments
// PUT    /api/community/posts/[postId] - Update post (author only)
// DELETE /api/community/posts/[postId] - Delete post (author or admin)
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
import { updatePostSchema } from "@/lib/validators/community";

// ---------------------------------------------------------------------------
// Route params type
// ---------------------------------------------------------------------------

interface RouteParams {
  params: { postId: string };
}

// ---------------------------------------------------------------------------
// GET - Get a single post with comments
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { postId } = params;

    // Optionally authenticate
    const auth = await requireAuth(req);
    const userId = !("response" in auth) ? auth.userId : null;

    const supabase = createAdminClient();

    // Fetch the post with author
    const { data: post, error } = await supabase
      .from("community_posts")
      .select(
        "*, author:profiles!community_posts_author_id_fkey(id, full_name, avatar_url, level)",
      )
      .eq("id", postId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return apiNotFound("Beitrag nicht gefunden");
      }
      return apiInternalError(error.message);
    }

    // Increment view count (fire-and-forget)
    supabase
      .from("community_posts")
      .update({ views_count: post.views_count + 1 })
      .eq("id", postId)
      .then();

    // Fetch comments with authors
    const { data: comments } = await supabase
      .from("comments")
      .select(
        "*, author:profiles!comments_author_id_fkey(id, full_name, avatar_url, level)",
      )
      .eq("entity_type", "community_post")
      .eq("entity_id", postId)
      .order("created_at", { ascending: true });

    // Check if user has upvoted this post
    let hasUpvoted = false;
    if (userId) {
      const { data: upvote } = await supabase
        .from("upvotes")
        .select("user_id")
        .eq("user_id", userId)
        .eq("entity_type", "community_post")
        .eq("entity_id", postId)
        .maybeSingle();

      hasUpvoted = !!upvote;
    }

    // Build nested comment tree
    const commentList = comments ?? [];
    const commentTree = buildCommentTree(commentList);

    return apiSuccess({
      ...post,
      hasUpvoted,
      comments: commentTree,
    });
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// PUT - Update a post (author only)
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { postId } = params;
    const supabase = createAdminClient();

    // Check ownership
    const { data: existingPost } = await supabase
      .from("community_posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (!existingPost) {
      return apiNotFound("Beitrag nicht gefunden");
    }

    if (existingPost.author_id !== auth.userId) {
      return apiError("FORBIDDEN", "Nur der Autor kann diesen Beitrag bearbeiten", 403);
    }

    const body: unknown = await req.json();
    const parsed = updatePostSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { data: updatedPost, error } = await supabase
      .from("community_posts")
      .update(parsed.data)
      .eq("id", postId)
      .select(
        "*, author:profiles!community_posts_author_id_fkey(id, full_name, avatar_url, level)",
      )
      .single();

    if (error) {
      return apiInternalError(error.message);
    }

    return apiSuccess(updatedPost);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// DELETE - Delete a post (author or admin)
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { postId } = params;
    const supabase = createAdminClient();

    // Check ownership or admin
    const { data: existingPost } = await supabase
      .from("community_posts")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (!existingPost) {
      return apiNotFound("Beitrag nicht gefunden");
    }

    const isOwner = existingPost.author_id === auth.userId;
    const isAdmin = auth.role === "admin" || auth.role === "super_admin";

    if (!isOwner && !isAdmin) {
      return apiError("FORBIDDEN", "Keine Berechtigung zum Loeschen dieses Beitrags", 403);
    }

    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      return apiInternalError(error.message);
    }

    return apiSuccess({ deleted: true });
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CommentRow {
  id: string;
  parent_id: string | null;
  [key: string]: unknown;
}

interface CommentNode extends CommentRow {
  replies: CommentNode[];
}

/**
 * Build a nested comment tree from a flat list of comments.
 */
function buildCommentTree(comments: CommentRow[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  // Initialize all nodes
  for (const comment of comments) {
    map.set(comment.id, { ...comment, replies: [] });
  }

  // Build tree
  for (const comment of comments) {
    const node = map.get(comment.id);
    if (!node) continue;

    if (comment.parent_id && map.has(comment.parent_id)) {
      const parent = map.get(comment.parent_id);
      parent?.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
