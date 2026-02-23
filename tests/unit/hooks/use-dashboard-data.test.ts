// =============================================================================
// Tests: useDashboardData Hook
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardData, clearDashboardCache } from "@/hooks/use-dashboard-data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchResponses(
  profileResponse: { status: number; body: unknown },
  leaderboardResponse: { status: number; body: unknown },
) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("/api/profile")) {
        return Promise.resolve({
          ok: profileResponse.status >= 200 && profileResponse.status < 300,
          status: profileResponse.status,
          json: () => Promise.resolve(profileResponse.body),
        });
      }
      if (url.includes("/api/leaderboard")) {
        return Promise.resolve({
          ok:
            leaderboardResponse.status >= 200 &&
            leaderboardResponse.status < 300,
          status: leaderboardResponse.status,
          json: () => Promise.resolve(leaderboardResponse.body),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    }),
  );
}

const VALID_PROFILE_RESPONSE = {
  status: 200,
  body: {
    data: {
      profile: {
        xp_total: 350,
        xp: 350,
        streak_days: 5,
        longest_streak: 12,
        level: 3,
        full_name: "Max Mustermann",
        avatar_url: null,
      },
      badges: [{ id: "1" }, { id: "2" }],
      stats: {
        postsCount: 10,
        coursesCompleted: 3,
      },
    },
    error: null,
  },
};

const VALID_LEADERBOARD_RESPONSE = {
  status: 200,
  body: {
    data: {
      entries: [
        { rank: 1, id: "u1", name: "Alice", xp: 500, isCurrentUser: false },
      ],
      currentUserRank: 5,
      totalActiveUsers: 42,
    },
    error: null,
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useDashboardData", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearDashboardCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Happy Path
  // -------------------------------------------------------------------------

  it("should fetch profile and leaderboard data in parallel and return combined data", async () => {
    mockFetchResponses(VALID_PROFILE_RESPONSE, VALID_LEADERBOARD_RESPONSE);

    const { result } = renderHook(() => useDashboardData());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).not.toBeNull();

    const data = result.current.data!;
    expect(data.xpTotal).toBe(350);
    expect(data.streakDays).toBe(5);
    expect(data.longestStreak).toBe(12);
    expect(data.userName).toBe("Max Mustermann");
    expect(data.postsCount).toBe(10);
    expect(data.coursesCompleted).toBe(3);
    expect(data.badgeCount).toBe(2);
    expect(data.communityRank).toBe(5);
    expect(data.totalActiveUsers).toBe(42);

    // Verify both endpoints were called
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // Level Info Computation
  // -------------------------------------------------------------------------

  it("should compute level info correctly from LEVELS constants (XP 350 = Level 3)", async () => {
    mockFetchResponses(VALID_PROFILE_RESPONSE, VALID_LEADERBOARD_RESPONSE);

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const levelInfo = result.current.data!.levelInfo;

    // XP 350 => Level 3 "KI-Anwender" (minXP: 300, maxXP: 600)
    expect(levelInfo.currentLevel.level).toBe(3);
    expect(levelInfo.currentLevel.title).toBe("KI-Anwender");
    expect(levelInfo.currentLevel.minXP).toBe(300);

    // Next level should be Level 4
    expect(levelInfo.nextLevel).not.toBeNull();
    expect(levelInfo.nextLevel!.level).toBe(4);

    // XP within level: 350 - 300 = 50
    expect(levelInfo.xpInLevel).toBe(50);
    // XP for level: 600 - 300 = 300
    expect(levelInfo.xpForLevel).toBe(300);
    // Percentage: (50 / 300) * 100 = ~16.67
    expect(levelInfo.percentage).toBeCloseTo(16.67, 1);
  });

  // -------------------------------------------------------------------------
  // Error Handling: 401
  // -------------------------------------------------------------------------

  it("should redirect to login on 401 response", async () => {
    mockFetchResponses(
      { status: 401, body: { data: null, error: null } },
      VALID_LEADERBOARD_RESPONSE,
    );

    const originalLocation = window.location;
    // @ts-ignore
    delete window.location;
    window.location = { ...originalLocation, href: "" } as any;

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(window.location.href).toBe("/login?redirectTo=/dashboard");
    expect(result.current.data).toBeNull();

    window.location = originalLocation as any;
  });

  // -------------------------------------------------------------------------
  // Error Handling: Network Error
  // -------------------------------------------------------------------------

  it("should handle network errors gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("Network failure"))),
    );

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network failure");
    expect(result.current.data).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Leaderboard Error is Non-Critical
  // -------------------------------------------------------------------------

  it("should use fallback values when leaderboard fails (non-critical)", async () => {
    mockFetchResponses(VALID_PROFILE_RESPONSE, {
      status: 500,
      body: { data: null, error: { code: "SERVER_ERROR", message: "fail" } },
    });

    const { result } = renderHook(() => useDashboardData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Profile data should still be present
    expect(result.current.error).toBeNull();
    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.xpTotal).toBe(350);

    // Leaderboard fallback values
    expect(result.current.data!.communityRank).toBeNull();
    expect(result.current.data!.totalActiveUsers).toBe(0);
  });
});
