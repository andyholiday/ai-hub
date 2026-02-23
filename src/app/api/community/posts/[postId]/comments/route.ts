// =============================================================================
// Community Post Comments API
// GET  /api/community/posts/[postId]/comments - List comments (threaded)
// POST /api/community/posts/[postId]/comments - Create a comment (auth req)
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiNotFound,
  apiValidationError,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCommentSchema } from "@/lib/validators/community";
import { awardCommunityXP } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievements";

// ---------------------------------------------------------------------------
// Route params type
// ---------------------------------------------------------------------------

interface RouteParams {
  params: { postId: string };
}

// ---------------------------------------------------------------------------
// GET - List comments for a post (threaded)
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { postId } = params;
    const supabase = createAdminClient();

    // Verify post exists
    const { data: post } = await supabase
      .from("community_posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (!post) {
      return apiNotFound("Beitrag nicht gefunden");
    }

    // Fetch all comments for this post
    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        "*, author:profiles!comments_author_id_fkey(id, full_name, avatar_url, level)",
      )
      .eq("entity_type", "community_post")
      .eq("entity_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      return apiInternalError(error.message);
    }

    // Build nested comment tree
    const commentTree = buildCommentTree(comments ?? []);

    return apiSuccess(commentTree);
  } catch {
    return apiInternalError();
  }
}

// ---------------------------------------------------------------------------
// POST - Create a comment
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { postId } = params;

    const body: unknown = await req.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { content, parent_id } = parsed.data;
    const supabase = createAdminClient();

    // Verify post exists
    const { data: post } = await supabase
      .from("community_posts")
      .select("id, author_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return apiNotFound("Beitrag nicht gefunden");
    }

    // If replying to a parent comment, verify it exists and belongs to this post
    if (parent_id) {
      const { data: parentComment } = await supabase
        .from("comments")
        .select("id")
        .eq("id", parent_id)
        .eq("entity_type", "community_post")
        .eq("entity_id", postId)
        .single();

      if (!parentComment) {
        return apiNotFound("Uebergeordneter Kommentar nicht gefunden");
      }
    }

    // Create the comment
    const { data: comment, error } = await supabase
      .from("comments")
      .insert({
        entity_type: "community_post",
        entity_id: postId,
        parent_id: parent_id ?? null,
        author_id: auth.userId,
        content,
      })
      .select(
        "*, author:profiles!comments_author_id_fkey(id, full_name, avatar_url, level)",
      )
      .single();

    if (error) {
      return apiInternalError(error.message);
    }

    // The DB trigger will increment comments_count on the post automatically

    // Award XP for comment creation (fire-and-forget)
    awardCommunityXP(supabase, auth.userId, "COMMENT_CREATED").then(() => {
      checkAndAwardBadges(supabase, auth.userId);
      checkAndUnlockAchievements(supabase, auth.userId).catch(() => {});
    });

    // Notify the post author about the comment (if commenter is not the author)
    if (post.author_id !== auth.userId) {
      supabase.from("notifications").insert({
        user_id: post.author_id,
        type: "comment",
        title: "Neuer Kommentar",
        message: "Jemand hat deinen Beitrag kommentiert.",
        link: `/community/${postId}`,
      }).then();
    }

    return apiSuccess({ ...comment, replies: [] }, 201);
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

function buildCommentTree(comments: CommentRow[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const comment of comments) {
    map.set(comment.id, { ...comment, replies: [] });
  }

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
