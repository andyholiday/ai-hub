// =============================================================================
// Gamification Constants
// Level system, badges, and XP configuration
// =============================================================================

// ---------------------------------------------------------------------------
// Level System
// ---------------------------------------------------------------------------

export interface LevelDefinition {
  level: number;
  title: string;
  minXP: number;
  maxXP: number;
}

export const LEVELS: LevelDefinition[] = [
  { level: 1, title: "KI-Neuling", minXP: 0, maxXP: 100 },
  { level: 2, title: "KI-Entdecker", minXP: 100, maxXP: 300 },
  { level: 3, title: "KI-Anwender", minXP: 300, maxXP: 600 },
  { level: 4, title: "KI-Praktiker", minXP: 600, maxXP: 1000 },
  { level: 5, title: "KI-Kenner", minXP: 1000, maxXP: 1500 },
  { level: 6, title: "KI-Experte", minXP: 1500, maxXP: 2200 },
  { level: 7, title: "KI-Spezialist", minXP: 2200, maxXP: 3000 },
  { level: 8, title: "KI-Meister", minXP: 3000, maxXP: 4000 },
  { level: 9, title: "KI-Virtuose", minXP: 4000, maxXP: 5500 },
  { level: 10, title: "KI-Legende", minXP: 5500, maxXP: Infinity },
];

// ---------------------------------------------------------------------------
// Badge Definitions
// ---------------------------------------------------------------------------

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "achievement" | "skill" | "social" | "special";
  requirement: string;
}

export const BADGES: BadgeDefinition[] = [
  // Achievement Badges
  {
    id: "first-steps",
    name: "Erste Schritte",
    description: "Onboarding abgeschlossen",
    icon: "footprints",
    category: "achievement",
    requirement: "complete_onboarding",
  },
  {
    id: "first-practice",
    name: "Erster Beitrag",
    description: "Erste Best Practice veroeffentlicht",
    icon: "pencil",
    category: "achievement",
    requirement: "publish_first_best_practice",
  },
  {
    id: "course-graduate",
    name: "Absolvent",
    description: "Ersten Kurs abgeschlossen",
    icon: "graduation-cap",
    category: "achievement",
    requirement: "complete_first_course",
  },
  {
    id: "challenge-winner",
    name: "Champion",
    description: "Erste Challenge gewonnen",
    icon: "trophy",
    category: "achievement",
    requirement: "win_first_challenge",
  },

  // Skill Badges
  {
    id: "prompt-engineer",
    name: "Prompt Engineer",
    description: "10 Best Practices zu Prompting veroeffentlicht",
    icon: "terminal",
    category: "skill",
    requirement: "publish_10_prompt_practices",
  },
  {
    id: "multi-tool",
    name: "Multi-Tool",
    description: "Alle KI-Tools mindestens einmal genutzt",
    icon: "wrench",
    category: "skill",
    requirement: "use_all_ai_tools",
  },

  // Social Badges
  {
    id: "helpful",
    name: "Hilfreich",
    description: "50 Likes auf eigene Beitraege erhalten",
    icon: "heart",
    category: "social",
    requirement: "receive_50_likes",
  },
  {
    id: "community-star",
    name: "Community Star",
    description: "25 Community-Beitraege geschrieben",
    icon: "star",
    category: "social",
    requirement: "write_25_community_posts",
  },

  // Special Badges
  {
    id: "early-adopter",
    name: "Early Adopter",
    description: "In den ersten 30 Tagen registriert",
    icon: "rocket",
    category: "special",
    requirement: "register_within_30_days",
  },
  {
    id: "streak-master",
    name: "Streak Master",
    description: "30 Tage in Folge aktiv",
    icon: "flame",
    category: "special",
    requirement: "30_day_streak",
  },
];

// ---------------------------------------------------------------------------
// XP Actions
// ---------------------------------------------------------------------------

export const XP_ACTIONS = {
  DAILY_LOGIN: 10,
  PUBLISH_BEST_PRACTICE: 50,
  COMPLETE_LESSON: 25,
  COMPLETE_COURSE: 100,
  CREATE_COMMUNITY_POST: 15,
  WRITE_COMMENT: 5,
  RECEIVE_LIKE: 3,
  COMPLETE_CHALLENGE: 100,
  WIN_CHALLENGE: 200,
  REFER_USER: 75,
} as const;
