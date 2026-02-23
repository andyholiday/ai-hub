// =============================================================================
// Tests: Achievement System Logic
// =============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkAndUnlockAchievements,
  getAchievementProgress,
} from "@/lib/gamification/achievements";

// Mock the xp module so awardXP does not hit a real DB
vi.mock("@/lib/gamification/xp", () => ({
  awardXP: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Supabase Mock Factory
// ---------------------------------------------------------------------------

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
}

function createMockQueryBuilder(resolveValue: unknown): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveValue),
    insert: vi.fn().mockResolvedValue({ error: null }),
  };
  // Make the builder itself a thenable that resolves for chained queries
  // that end without .single()
  Object.defineProperty(builder, "then", {
    value: (resolve: (v: unknown) => void) => resolve(resolveValue),
    configurable: true,
  });
  return builder;
}

function createMockSupabase(tableResponses: Record<string, unknown>) {
  return {
    from: vi.fn((table: string) => {
      const response = tableResponses[table] ?? { data: null, count: null };
      return createMockQueryBuilder(response);
    }),
  } as unknown as Parameters<typeof checkAndUnlockAchievements>[0];
}

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const MOCK_ACHIEVEMENTS = [
  {
    id: "ach-1",
    key: "first_post",
    title: "Erster Beitrag",
    description: "Schreibe deinen ersten Beitrag",
    icon: "pencil",
    category: "community" as const,
    requirement_type: "posts_count" as const,
    requirement_value: 1,
    xp_reward: 50,
  },
  {
    id: "ach-2",
    key: "xp_100",
    title: "100 XP",
    description: "Sammle 100 XP",
    icon: "star",
    category: "progress" as const,
    requirement_type: "xp_total" as const,
    requirement_value: 100,
    xp_reward: 25,
  },
  {
    id: "ach-3",
    key: "streak_7",
    title: "7-Tage-Streak",
    description: "7 Tage in Folge aktiv",
    icon: "flame",
    category: "special" as const,
    requirement_type: "login_streak" as const,
    requirement_value: 7,
    xp_reward: 30,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("checkAndUnlockAchievements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when no achievements exist", async () => {
    const supabase = createMockSupabase({
      achievements: { data: [], count: null },
    });

    const result = await checkAndUnlockAchievements(supabase, "user-1");
    expect(result).toEqual([]);
  });

  it("should unlock achievements when requirements are met", async () => {
    // User has 5 posts and 200 XP and streak of 3
    const supabase = createMockSupabase({
      achievements: { data: MOCK_ACHIEVEMENTS },
      user_achievements: { data: [] }, // none unlocked yet
      profiles: { data: { xp: 200, streak_days: 3 } },
      community_posts: { data: [], count: 5 },
      comments: { data: null, count: 0 },
      user_course_progress: { data: null, count: 0 },
      user_lesson_progress: { data: null, count: 0 },
      upvotes: { data: null, count: 0 },
      user_badges: { data: null, count: 0 },
    });

    const result = await checkAndUnlockAchievements(supabase, "user-1");

    // Should unlock "first_post" (posts >= 1) and "xp_100" (xp >= 100)
    // Should NOT unlock "streak_7" (streak 3 < 7)
    const unlockedKeys = result.map((a) => a.key);
    expect(unlockedKeys).toContain("first_post");
    expect(unlockedKeys).toContain("xp_100");
    expect(unlockedKeys).not.toContain("streak_7");
  });

  it("should NOT re-unlock already unlocked achievements", async () => {
    // "first_post" is already unlocked
    const supabase = createMockSupabase({
      achievements: { data: MOCK_ACHIEVEMENTS },
      user_achievements: { data: [{ achievement_id: "ach-1" }] },
      profiles: { data: { xp: 200, streak_days: 10 } },
      community_posts: { data: [], count: 5 },
      comments: { data: null, count: 0 },
      user_course_progress: { data: null, count: 0 },
      user_lesson_progress: { data: null, count: 0 },
      upvotes: { data: null, count: 0 },
      user_badges: { data: null, count: 0 },
    });

    const result = await checkAndUnlockAchievements(supabase, "user-1");

    // "first_post" should NOT appear because it is already unlocked
    const unlockedKeys = result.map((a) => a.key);
    expect(unlockedKeys).not.toContain("first_post");
    // "xp_100" and "streak_7" should be unlocked
    expect(unlockedKeys).toContain("xp_100");
    expect(unlockedKeys).toContain("streak_7");
  });

  it("should return empty array when all achievements are already unlocked", async () => {
    const supabase = createMockSupabase({
      achievements: { data: MOCK_ACHIEVEMENTS },
      user_achievements: {
        data: [
          { achievement_id: "ach-1" },
          { achievement_id: "ach-2" },
          { achievement_id: "ach-3" },
        ],
      },
    });

    const result = await checkAndUnlockAchievements(supabase, "user-1");
    expect(result).toEqual([]);
  });

  it("should return empty array when profile is not found (stats null)", async () => {
    const supabase = createMockSupabase({
      achievements: { data: MOCK_ACHIEVEMENTS },
      user_achievements: { data: [] },
      profiles: { data: null },
    });

    const result = await checkAndUnlockAchievements(supabase, "user-1");
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getAchievementProgress
// ---------------------------------------------------------------------------

describe("getAchievementProgress", () => {
  it("should return user stats when profile exists", async () => {
    const supabase = createMockSupabase({
      profiles: { data: { xp: 500, streak_days: 14 } },
      community_posts: { data: [{ id: "p1" }], count: 3 },
      comments: { data: null, count: 7 },
      user_course_progress: { data: null, count: 2 },
      user_lesson_progress: { data: null, count: 10 },
      upvotes: { data: null, count: 0 },
      user_badges: { data: null, count: 4 },
    });

    const result = await getAchievementProgress(supabase, "user-1");
    expect(result).not.toBeNull();
    expect(result!.xpTotal).toBe(500);
    expect(result!.loginStreak).toBe(14);
  });

  it("should return null when profile does not exist", async () => {
    const supabase = createMockSupabase({
      profiles: { data: null },
    });

    const result = await getAchievementProgress(supabase, "user-1");
    expect(result).toBeNull();
  });
});
