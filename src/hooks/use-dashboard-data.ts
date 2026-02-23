// =============================================================================
// useDashboardData Hook
// Fetches profile, stats, and leaderboard data for the dashboard.
// Single fetch point to avoid redundant API calls across widgets.
//
// OPTIMIZED:
// - Client-side stale-while-revalidate cache: Serves cached data immediately
//   on subsequent visits, then refreshes in background.
// - Leaderboard uses a longer cache (5 min) since it changes less frequently.
// - Profile data is cached for 30 seconds to balance freshness and cost.
// - Both APIs now backed by single DB functions (server-side optimization).
// =============================================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LEVELS, type LevelDefinition } from "@/constants/gamification";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProfileData {
  xp_total: number;
  xp: number;
  streak_days: number;
  longest_streak: number;
  level: number;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
}

interface ProfileApiResponse {
  data: {
    profile: ProfileData;
    badges: unknown[];
    stats: {
      postsCount: number;
      coursesCompleted: number;
    };
  } | null;
  error: { code: string; message: string } | null;
}

interface LeaderboardApiResponse {
  data: {
    entries: Array<{
      rank: number;
      id: string;
      name: string;
      xp: number;
      isCurrentUser: boolean;
    }>;
    currentUserRank: number | null;
    totalActiveUsers: number;
  } | null;
  error: { code: string; message: string } | null;
}

export interface LevelInfo {
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  /** XP within the current level range (progress numerator) */
  xpInLevel: number;
  /** Total XP needed to complete this level (progress denominator) */
  xpForLevel: number;
  /** Progress percentage 0-100 */
  percentage: number;
}

export interface DashboardData {
  // Profile
  xpTotal: number;
  streakDays: number;
  longestStreak: number;
  userName: string | null;
  onboardingCompleted: boolean;

  // Stats
  postsCount: number;
  coursesCompleted: number;
  badgeCount: number;

  // Leaderboard
  communityRank: number | null;
  totalActiveUsers: number;

  // Level info (computed from LEVELS constants)
  levelInfo: LevelInfo;
}

export interface UseDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Client-side Cache (module-level, persists across re-renders)
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: {
  profile: CacheEntry<ProfileApiResponse["data"]> | null;
  leaderboard: CacheEntry<LeaderboardApiResponse["data"]> | null;
} = {
  profile: null,
  leaderboard: null,
};

/** Profile cache: 30 seconds */
const PROFILE_CACHE_TTL = 30_000;
/** Leaderboard cache: 5 minutes (changes infrequently) */
const LEADERBOARD_CACHE_TTL = 300_000;

function isCacheValid<T>(entry: CacheEntry<T> | null, ttl: number): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < ttl;
}

export function clearDashboardCache() {
  cache.profile = null;
  cache.leaderboard = null;
}

// ---------------------------------------------------------------------------
// Level Computation Helper
// ---------------------------------------------------------------------------

function computeLevelInfo(xp: number): LevelInfo {
  // Find the current level based on XP
  let currentLevel = LEVELS[0]!;
  for (const level of LEVELS) {
    if (xp >= level.minXP) {
      currentLevel = level;
    } else {
      break;
    }
  }

  // Find the next level
  const currentIndex = LEVELS.findIndex((l) => l.level === currentLevel.level);
  const nextLevel =
    currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1]! : null;

  // Calculate progress within current level
  const xpInLevel = xp - currentLevel.minXP;
  const xpForLevel = currentLevel.maxXP === Infinity
    ? xpInLevel // At max level, show current XP as progress
    : currentLevel.maxXP - currentLevel.minXP;

  const percentage =
    xpForLevel > 0 ? Math.min(100, Math.max(0, (xpInLevel / xpForLevel) * 100)) : 100;

  return {
    currentLevel,
    nextLevel,
    xpInLevel,
    xpForLevel,
    percentage,
  };
}

// ---------------------------------------------------------------------------
// Helper: Build DashboardData from API responses
// ---------------------------------------------------------------------------

function buildDashboardData(
  profileData: ProfileApiResponse["data"],
  leaderboardData: LeaderboardApiResponse["data"],
): DashboardData {
  const profile = profileData!.profile;
  const badges = profileData!.badges;
  const stats = profileData!.stats;

  const xpTotal = profile.xp_total ?? profile.xp ?? 0;
  const levelInfo = computeLevelInfo(xpTotal);

  return {
    xpTotal,
    streakDays: profile.streak_days ?? 0,
    longestStreak: profile.longest_streak ?? 0,
    userName: profile.full_name ?? profile.username ?? null,
    onboardingCompleted: profile.onboarding_completed ?? false,

    postsCount: stats.postsCount,
    coursesCompleted: stats.coursesCompleted,
    badgeCount: badges?.length ?? 0,
    communityRank: leaderboardData?.currentUserRank ?? null,
    totalActiveUsers: leaderboardData?.totalActiveUsers ?? 0,
    levelInfo,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isRefreshing = useRef(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    // If we have valid cached data, serve it immediately (stale-while-revalidate)
    const hasValidProfileCache = isCacheValid(cache.profile, PROFILE_CACHE_TTL);
    const hasValidLeaderboardCache = isCacheValid(cache.leaderboard, LEADERBOARD_CACHE_TTL);

    if (!forceRefresh && hasValidProfileCache && cache.profile?.data) {
      // Serve cached data instantly - no loading state
      setData(buildDashboardData(cache.profile.data, cache.leaderboard?.data ?? null));
      setIsLoading(false);

      // If leaderboard is stale, refresh it in background
      if (!hasValidLeaderboardCache && !isRefreshing.current) {
        isRefreshing.current = true;
        fetch("/api/leaderboard?period=all&limit=50")
          .then((res) => res.ok ? res.json() : null)
          .then((json: LeaderboardApiResponse | null) => {
            if (json?.data) {
              cache.leaderboard = { data: json.data, timestamp: Date.now() };
              // Update leaderboard portion of displayed data
              setData((prev) =>
                prev
                  ? {
                    ...prev,
                    communityRank: json.data!.currentUserRank ?? null,
                    totalActiveUsers: json.data!.totalActiveUsers ?? 0,
                  }
                  : prev,
              );
            }
          })
          .finally(() => { isRefreshing.current = false; });
      }
      return;
    }

    // No valid cache - do a full fetch
    setIsLoading(true);
    setError(null);

    try {
      // Determine what needs to be fetched
      const fetches: Promise<Response>[] = [fetch("/api/profile")];

      // Only fetch leaderboard if cache is stale
      if (!hasValidLeaderboardCache) {
        fetches.push(fetch("/api/leaderboard?period=all&limit=50"));
      }

      const responses = await Promise.all(fetches);
      const profileRes = responses[0]!;
      const leaderboardRes = responses[1]; // may be undefined if cache was valid

      if (!profileRes.ok) {
        if (profileRes.status === 401 || profileRes.status === 403) {
          window.location.href = "/login?redirectTo=/dashboard";
          return;
        }
        throw new Error("Profildaten konnten nicht geladen werden.");
      }

      const profileJson: ProfileApiResponse = await profileRes.json();

      if (profileJson.error || !profileJson.data) {
        throw new Error(
          profileJson.error?.message ?? "Profildaten konnten nicht geladen werden.",
        );
      }

      // Update profile cache
      cache.profile = { data: profileJson.data, timestamp: Date.now() };

      // Update leaderboard cache if we fetched new data
      if (leaderboardRes?.ok) {
        const leaderboardJson: LeaderboardApiResponse = await leaderboardRes.json();
        if (leaderboardJson.data) {
          cache.leaderboard = { data: leaderboardJson.data, timestamp: Date.now() };
        }
      }

      setData(buildDashboardData(cache.profile.data, cache.leaderboard?.data ?? null));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ein unbekannter Fehler ist aufgetreten.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // refetch always forces a fresh load
  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return { data, isLoading, error, refetch };
}
