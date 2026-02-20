// =============================================================================
// Community API Zod Validators
// Validation schemas for all /api/community/* route inputs
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Post Types
// ---------------------------------------------------------------------------

export const communityPostTypes = [
  "discussion",
  "idea",
  "show_and_tell",
  "question",
  "challenge",
] as const;

export type CommunityPostType = (typeof communityPostTypes)[number];

// ---------------------------------------------------------------------------
// Post Creation / Update
// ---------------------------------------------------------------------------

/**
 * POST /api/community/posts - Create a new community post
 */
export const createPostSchema = z.object({
  title: z
    .string()
    .min(3, "Titel muss mindestens 3 Zeichen lang sein")
    .max(200, "Titel darf maximal 200 Zeichen lang sein"),
  content: z
    .string()
    .min(10, "Inhalt muss mindestens 10 Zeichen lang sein")
    .max(50_000, "Inhalt darf maximal 50.000 Zeichen lang sein"),
  type: z.enum(communityPostTypes, {
    errorMap: () => ({ message: "Ungueltiger Post-Typ" }),
  }),
  tags: z
    .array(z.string().min(1).max(50))
    .max(10, "Maximal 10 Tags erlaubt")
    .default([]),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

/**
 * PUT /api/community/posts/[postId] - Update an existing post
 */
export const updatePostSchema = z.object({
  title: z
    .string()
    .min(3, "Titel muss mindestens 3 Zeichen lang sein")
    .max(200, "Titel darf maximal 200 Zeichen lang sein")
    .optional(),
  content: z
    .string()
    .min(10, "Inhalt muss mindestens 10 Zeichen lang sein")
    .max(50_000, "Inhalt darf maximal 50.000 Zeichen lang sein")
    .optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(10, "Maximal 10 Tags erlaubt")
    .optional(),
});

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

/**
 * POST /api/community/posts/[postId]/comments - Create a comment
 */
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Kommentar darf nicht leer sein")
    .max(10_000, "Kommentar darf maximal 10.000 Zeichen lang sein"),
  parent_id: z
    .string()
    .uuid("Ungueltige Kommentar-ID")
    .nullable()
    .optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// ---------------------------------------------------------------------------
// Voting
// ---------------------------------------------------------------------------

/**
 * POST /api/community/posts/[postId]/vote - Toggle upvote
 */
export const voteSchema = z.object({
  direction: z.enum(["up", "down"], {
    errorMap: () => ({ message: "Ungueltige Vote-Richtung" }),
  }),
});

export type VoteInput = z.infer<typeof voteSchema>;

// ---------------------------------------------------------------------------
// Query Parameters
// ---------------------------------------------------------------------------

/**
 * GET /api/community/posts - Query parameters for listing posts
 */
export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(communityPostTypes).optional(),
  tag: z.string().optional(),
  sort: z.enum(["newest", "most_upvoted", "most_viewed"]).default("newest"),
  search: z.string().max(200).optional(),
});

export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;
