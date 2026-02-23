// =============================================================================
// Community Post Vote API
// POST /api/community/posts/[postId]/vote - Toggle upvote
// =============================================================================

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/require-auth";
import {
  apiSuccess,
  apiInternalError,
  apiNotFound,
} from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { awardCommunityXP } from "@/lib/gamification/xp";
import { checkAndAwardBadges } from "@/lib/gamification/badges";
import { checkAndUnlockAchievements } from "@/lib/gamification/achievements";

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Route params type
// ---------------------------------------------------------------------------

interface RouteParams {
  params: { postId: string };
}

// ---------------------------------------------------------------------------
// POST - Toggle upvote (vote again to remove)
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;

    const { postId } = params;
    const supabase = createAdminClient();

    // Verify post exists and get author
    const { data: post } = await supabase
      .from("community_posts")
      .select("id, author_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return apiNotFound("Beitrag nicht gefunden");
    }

    // Check if user has already upvoted
    const { data: existingVote } = await supabase
      .from("upvotes")
      .select("user_id")
      .eq("user_id", auth.userId)
      .eq("entity_type", "community_post")
      .eq("entity_id", postId)
      .maybeSingle();

    if (existingVote) {
      // Remove the upvote (toggle off)
      const { error } = await supabase
        .from("upvotes")
        .delete()
        .eq("user_id", auth.userId)
        .eq("entity_type", "community_post")
        .eq("entity_id", postId);

      if (error) {
        return apiInternalError(error.message);
      }

      // The DB trigger will decrement upvotes_count automatically

      return apiSuccess({ voted: false, postId });
    } else {
      // Add upvote
      const { error } = await supabase
        .from("upvotes")
        .insert({
          user_id: auth.userId,
          entity_type: "community_post",
          entity_id: postId,
        });

      if (error) {
        return apiInternalError(error.message);
      }

      // The DB trigger will increment upvotes_count automatically

      // Award XP to the post author for receiving an upvote (fire-and-forget)
      // Only if the voter is not the author themselves
      if (post.author_id !== auth.userId) {
        awardCommunityXP(supabase, post.author_id, "UPVOTE_RECEIVED").then(
          () => {
            checkAndAwardBadges(supabase, post.author_id);
            checkAndUnlockAchievements(supabase, post.author_id).catch(() => {});
          },
        );
      }

      return apiSuccess({ voted: true, postId });
    }
  } catch {
    return apiInternalError();
  }
}
