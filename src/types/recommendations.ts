// =============================================================================
// Recommendation Types
// Types for the personalized recommendations system on the dashboard
// =============================================================================

// ---------------------------------------------------------------------------
// Recommendation Type Enum
// ---------------------------------------------------------------------------

export type RecommendationType =
  | "continue_course"
  | "new_course"
  | "best_practice"
  | "community_post"
  | "challenge";

// ---------------------------------------------------------------------------
// Recommendation Entity
// ---------------------------------------------------------------------------

export interface Recommendation {
  /** Unique identifier of the recommended resource */
  id: string;
  /** Category of the recommendation */
  type: RecommendationType;
  /** Display title */
  title: string;
  /** Short description or excerpt */
  description: string;
  /** Human-readable reason for the recommendation (e.g. "Weil du Kurs X angefangen hast") */
  reason: string;
  /** Relative link to the recommended resource */
  href: string;
  /** Sort priority (higher = more important) */
  priority: number;
  /** Optional metadata depending on type */
  metadata?: RecommendationMetadata;
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export interface RecommendationMetadata {
  /** Course progress percentage (0-100) for continue_course */
  progress?: number;
  /** Upvote / like count for best_practice or community_post */
  upvotes?: number;
  /** Difficulty level for courses and challenges */
  difficulty?: "beginner" | "intermediate" | "advanced";
  /** XP reward for challenges */
  xpReward?: number;
  /** Number of comments for community posts */
  commentsCount?: number;
  /** Days remaining for challenges */
  daysRemaining?: number;
}
