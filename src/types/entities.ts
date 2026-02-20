// =============================================================================
// Domain Entity Types
// Application-level types derived from database schema
// =============================================================================

import type { Tables } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// User & Profile
// ---------------------------------------------------------------------------

export type Profile = Tables<"profiles">;

export interface UserWithStats extends Profile {
  rank: number;
  completedCourses: number;
  completedChallenges: number;
  bestPracticesCount: number;
  communityPostsCount: number;
}

export interface LeaderboardEntry {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  level: number;
  xpPoints: number;
  rank: number;
  badges: string[];
}

// ---------------------------------------------------------------------------
// Best Practices
// ---------------------------------------------------------------------------

export type BestPractice = Tables<"best_practices">;

export interface BestPracticeWithAuthor extends BestPractice {
  author: Pick<Profile, "id" | "full_name" | "avatar_url" | "level">;
}

export interface BestPracticeFilters {
  category?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  aiTool?: string;
  search?: string;
  sortBy?: "newest" | "popular" | "most_liked";
}

// ---------------------------------------------------------------------------
// Learn Hub
// ---------------------------------------------------------------------------

export type Course = Tables<"courses">;
export type Lesson = Tables<"lessons">;

export interface CourseWithProgress extends Course {
  completedLessons: number;
  progressPercentage: number;
  isCompleted: boolean;
  isStarted: boolean;
}

export interface LessonWithProgress extends Lesson {
  isCompleted: boolean;
  score: number | null;
}

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

export type CommunityPost = Tables<"community_posts">;
export type Comment = Tables<"comments">;

export interface CommunityPostWithAuthor extends CommunityPost {
  author: Pick<Profile, "id" | "full_name" | "avatar_url" | "level">;
  hasUpvoted: boolean;
}

export interface CommentWithAuthor extends Comment {
  author: Pick<Profile, "id" | "full_name" | "avatar_url" | "level">;
  replies?: CommentWithAuthor[];
}

export interface CommunityPostDetail extends CommunityPostWithAuthor {
  comments: CommentWithAuthor[];
}

// ---------------------------------------------------------------------------
// AI Mentor
// ---------------------------------------------------------------------------

export type AIChatSession = Tables<"ai_chat_sessions">;
export type AIChatMessage = Tables<"ai_chat_messages">;

export interface ChatSessionWithLastMessage extends AIChatSession {
  lastMessage: string | null;
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

export type Challenge = Tables<"challenges">;

export interface ChallengeWithProgress extends Challenge {
  participantsCount: number;
  isParticipating: boolean;
  userStatus: "not_started" | "in_progress" | "completed" | null;
  userScore: number | null;
}

// ---------------------------------------------------------------------------
// Innovation Radar
// ---------------------------------------------------------------------------

export type InnovationRadarItem = Tables<"innovation_radar_items">;

export interface RadarItemWithVote extends InnovationRadarItem {
  isVotedByUser: boolean;
}

// ---------------------------------------------------------------------------
// User Progress / Gamification
// ---------------------------------------------------------------------------

export type UserProgress = Tables<"user_progress">;

export interface GamificationStats {
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  currentLevelXP: number;
  badges: Badge[];
  streak: number;
  rank: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "achievement" | "skill" | "social" | "special";
  earnedAt?: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  userId: string;
  type: "achievement" | "comment" | "like" | "challenge" | "system" | "mention";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface DashboardData {
  profile: Profile;
  gamification: GamificationStats;
  recentActivity: ActivityItem[];
  activeChallenges: ChallengeWithProgress[];
  recommendedCourses: Course[];
  trendingPosts: CommunityPostWithAuthor[];
}

export interface ActivityItem {
  id: string;
  type: "course_completed" | "badge_earned" | "post_created" | "challenge_joined" | "xp_gained";
  title: string;
  description: string;
  xpGained?: number;
  timestamp: string;
}
