// =============================================================================
// Site Configuration
// Central configuration for the LR AI Hub application
// =============================================================================

export const siteConfig = {
  name: "LR AI Hub",
  description:
    "Die KI-Community-Plattform fuer LR Health & Beauty Systems Partner. Lernen, teilen und wachsen mit kuenstlicher Intelligenz.",
  url: process.env.NEXT_PUBLIC_APP_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000"),
  ogImage: "/images/og-image.png",

  // LR Branding
  company: {
    name: "LR Health & Beauty Systems",
    website: "https://www.lrworld.com",
  },

  // Feature Flags
  features: {
    aiMentor: true,
    innovationRadar: true,
    challenges: true,
    gamification: true,
    realtime: true,
    darkMode: true,
  },

  // Gamification Settings
  gamification: {
    xpPerBestPractice: 50,
    xpPerCourseLesson: 25,
    xpPerCommunityPost: 15,
    xpPerComment: 5,
    xpPerLikeReceived: 3,
    xpPerChallengeCompletion: 100,
    xpPerDailyLogin: 10,
  },

  // Pagination Defaults
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  // AI Configuration
  ai: {
    maxMessagesPerSession: 100,
    maxTokensPerRequest: 4096,
    defaultTemperature: 0.7,
  },
} as const;

export type SiteConfig = typeof siteConfig;
