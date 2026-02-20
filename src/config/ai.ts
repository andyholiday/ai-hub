// =============================================================================
// AI Feature Configuration
// Settings specific to AI Mentor and AI-powered features
// =============================================================================

export const aiConfig = {
  // System prompt for the AI Mentor persona
  mentorPersona: {
    name: "LR AI Mentor",
    role: "KI-Berater fuer LR Partner",
    language: "de",
  },

  // Rate limiting per user
  rateLimits: {
    messagesPerHour: 60,
    messagesPerDay: 500,
    sessionsPerDay: 20,
  },

  // Content moderation
  moderation: {
    enabled: true,
    blockProfanity: true,
    blockPersonalData: true,
    maxMessageLength: 5000,
  },

  // Feature-specific AI usage
  features: {
    // AI-powered content suggestions for Best Practices
    contentSuggestions: {
      enabled: true,
      provider: "gemini" as const,
    },
    // AI-generated quiz questions for Learn Hub
    quizGeneration: {
      enabled: true,
      provider: "openai" as const,
    },
    // AI summary of community discussions
    threadSummary: {
      enabled: true,
      provider: "gemini" as const,
    },
  },
} as const;
