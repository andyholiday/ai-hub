// =============================================================================
// Route Constants
// Central route definitions for type-safe navigation
// =============================================================================

export const ROUTES = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  CALLBACK: "/callback",

  // Main Navigation
  DASHBOARD: "/dashboard",
  BEST_PRACTICES: "/best-practices",
  BEST_PRACTICE_DETAIL: (id: string) => `/best-practices/${id}` as const,
  BEST_PRACTICE_NEW: "/best-practices/new",
  LEARN_HUB: "/learn-hub",
  COURSE_DETAIL: (courseId: string) => `/learn-hub/${courseId}` as const,
  LESSON_DETAIL: (courseId: string, lessonId: string) =>
    `/learn-hub/${courseId}/${lessonId}` as const,
  COMMUNITY: "/community",
  COMMUNITY_POST: (postId: string) => `/community/${postId}` as const,
  AI_MENTOR: "/ai-mentor",
  AI_MENTOR_SESSION: (sessionId: string) => `/ai-mentor/${sessionId}` as const,
  INNOVATION_RADAR: "/innovation-radar",
  LEADERBOARD: "/leaderboard",
  CHALLENGES: "/challenges",
  CHALLENGE_DETAIL: (challengeId: string) => `/challenges/${challengeId}` as const,

  // Profile
  PROFILE: "/profile",
  PROFILE_SETTINGS: "/profile/settings",
  NOTIFICATIONS: "/notifications",

  // Admin
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_CONTENT: "/admin/content",
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_AI_CONFIG: "/admin/ai-config",
  ADMIN_SETTINGS: "/admin/settings",
} as const;
