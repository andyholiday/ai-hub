// =============================================================================
// Site Configuration
// Central configuration for the AI Hub application
// =============================================================================

export const siteConfig = {
  name: "AI Hub",
  description:
    "Die KI-Community-Plattform zum Lernen, Teilen und Wachsen mit kuenstlicher Intelligenz.",
  url: process.env.NEXT_PUBLIC_APP_URL || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "http://localhost:3000"),
  ogImage: "/images/og-image.png",

  // Company Branding
  company: {
    name: "AppManufaktor",
    website: "https://www.appmanufaktor.com",
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
