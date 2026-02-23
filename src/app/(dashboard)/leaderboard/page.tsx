// =============================================================================
// Leaderboard Page
// Ranking overview with top 3 podium, stats, and full leaderboard table
// =============================================================================

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { StatCard } from "@/components/ui";
import {
  TopThree,
  LeaderboardTable,
  type TopThreeUser,
  type LeaderboardUser,
} from "@/components/features/gamification";
import { LEVELS } from "@/constants/gamification";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Period = "week" | "month" | "all";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatarUrl: string | null;
  department: string | null;
  level: number;
  xp: number;
  isCurrentUser: boolean;
}

interface LeaderboardApiResponse {
  data: {
    entries: LeaderboardEntry[];
    totalActiveUsers: number;
    currentUserRank: number | null;
    currentUserXp: number | null;
    currentUserLevel: number | null;
    period: Period;
  };
  error: null;
}

// -----------------------------------------------------------------------------
// Level Title Helper
// -----------------------------------------------------------------------------

function getLevelTitle(level: number): string {
  const clamped = Math.max(1, Math.min(level, LEVELS.length));
  return LEVELS[clamped - 1]?.title ?? "KI-Neuling";
}

// -----------------------------------------------------------------------------
// Period Tabs
// -----------------------------------------------------------------------------

const periodTabs: { key: Period; label: string }[] = [
  { key: "week", label: "Diese Woche" },
  { key: "month", label: "Dieser Monat" },
  { key: "all", label: "Gesamt" },
];

// -----------------------------------------------------------------------------
// Stat Icons (inline SVG)
// -----------------------------------------------------------------------------

function RankIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function XPIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Loading Skeleton
// -----------------------------------------------------------------------------

function LeaderboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-48 rounded-lg bg-surface-200 animate-pulse" />
          <div className="mt-2 h-5 w-72 rounded-lg bg-surface-100 animate-pulse" />
        </div>
        <div className="h-10 w-64 rounded-xl bg-surface-100 animate-pulse" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[14px] border border-surface-200 bg-white p-5 shadow-card"
          >
            <div className="flex items-start justify-between">
              <div className="h-4 w-20 rounded bg-surface-100 animate-pulse" />
              <div className="h-10 w-10 rounded-xl bg-surface-100 animate-pulse" />
            </div>
            <div className="mt-3 h-7 w-16 rounded bg-surface-200 animate-pulse" />
            <div className="mt-2 h-3.5 w-24 rounded bg-surface-100 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Podium skeleton */}
      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-card">
        <div className="flex items-end justify-center gap-5 pt-16 pb-4">
          {[2, 1, 3].map((rank) => (
            <div key={rank} className="flex flex-col items-center">
              <div
                className={cn(
                  "w-[180px] rounded-2xl border border-surface-200 bg-white p-5 pt-14",
                  rank === 1 ? "-mt-6" : ""
                )}
              >
                <div className="mx-auto h-6 w-6 rounded-full bg-surface-200 animate-pulse" />
                <div className="mx-auto mt-3 h-5 w-24 rounded bg-surface-200 animate-pulse" />
                <div className="mx-auto mt-1 h-3 w-16 rounded bg-surface-100 animate-pulse" />
                <div className="mx-auto mt-3 h-6 w-20 rounded bg-surface-200 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div>
        <div className="mb-3 h-6 w-28 rounded bg-surface-200 animate-pulse" />
        <div className="rounded-2xl border border-surface-200 bg-white shadow-card overflow-hidden">
          <div className="border-b border-surface-200 bg-surface-50 px-4 py-3">
            <div className="h-4 w-full rounded bg-surface-100 animate-pulse" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-surface-100 px-4 py-3.5"
            >
              <div className="h-8 w-8 rounded-full bg-surface-100 animate-pulse" />
              <div className="h-8 w-8 rounded-full bg-surface-200 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded bg-surface-200 animate-pulse" />
              </div>
              <div className="h-4 w-16 rounded bg-surface-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [totalActiveUsers, setTotalActiveUsers] = useState(0);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentUserXp, setCurrentUserXp] = useState<number | null>(null);
  const [currentUserLevel, setCurrentUserLevel] = useState<number | null>(null);

  // ---------------------------------------------------------------------------
  // Fetch leaderboard data
  // ---------------------------------------------------------------------------

  const fetchLeaderboard = useCallback(async (selectedPeriod: Period) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leaderboard?period=${selectedPeriod}&limit=50`
      );
      if (!res.ok) {
        console.error("Leaderboard fetch failed:", res.status);
        return;
      }

      const json = (await res.json()) as LeaderboardApiResponse;
      const data = json.data;

      setEntries(data.entries);
      setTotalActiveUsers(data.totalActiveUsers);
      setCurrentUserRank(data.currentUserRank);
      setCurrentUserXp(data.currentUserXp);
      setCurrentUserLevel(data.currentUserLevel);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(period);
  }, [period, fetchLeaderboard]);

  // ---------------------------------------------------------------------------
  // Map API data to component types
  // ---------------------------------------------------------------------------

  const topThreeData: TopThreeUser[] = entries
    .slice(0, 3)
    .map((entry) => ({
      rank: entry.rank as 1 | 2 | 3,
      name: entry.name,
      avatarUrl: entry.avatarUrl ?? undefined,
      xp: entry.xp,
      level: entry.level,
      levelTitle: getLevelTitle(entry.level),
      department: entry.department ?? "",
    }));

  const leaderboardData: LeaderboardUser[] = entries.map((entry) => ({
    rank: entry.rank,
    name: entry.name,
    avatarUrl: entry.avatarUrl ?? undefined,
    department: entry.department ?? "",
    level: entry.level,
    levelTitle: getLevelTitle(entry.level),
    xpTotal: entry.xp,
    // NOTE: xpPeriod is the same as xpTotal until an xp_history table is added
    xpPeriod: entry.xp,
    isCurrentUser: entry.isCurrentUser,
  }));

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (loading) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-headline-lg font-bold text-surface-900">
            Leaderboard
          </h1>
          <p className="mt-1 text-body text-surface-500">
            Sieh, wie du im Vergleich zu deinen Kollegen abschneidest.
          </p>
        </div>

        {/* Period Tabs */}
        <div className="flex rounded-xl bg-surface-100 p-1">
          {periodTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={cn(
                "rounded-lg px-4 py-2 text-body-sm font-medium transition-all duration-200",
                period === tab.key
                  ? "bg-white text-surface-900 shadow-sm"
                  : "text-surface-500 hover:text-surface-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Dein Rang"
          value={currentUserRank ? `#${currentUserRank}` : "-"}
          changeDirection="neutral"
          icon={<RankIcon />}
          iconVariant="green"
        />
        <StatCard
          label="Deine XP"
          value={
            currentUserXp !== null
              ? currentUserXp.toLocaleString("de-DE")
              : "-"
          }
          changeDirection="neutral"
          icon={<XPIcon />}
          iconVariant="gold"
        />
        <StatCard
          label="Dein Level"
          value={
            currentUserLevel !== null ? `Lvl ${currentUserLevel}` : "-"
          }
          change={
            currentUserLevel !== null
              ? getLevelTitle(currentUserLevel)
              : undefined
          }
          changeDirection="neutral"
          icon={<LevelIcon />}
          iconVariant="purple"
        />
        <StatCard
          label="Aktive User"
          value={totalActiveUsers.toLocaleString("de-DE")}
          changeDirection="neutral"
          icon={<UsersIcon />}
          iconVariant="blue"
        />
      </div>

      {/* Top 3 Podium */}
      {topThreeData.length >= 3 && (
        <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-card sm:p-6">
          <TopThree users={topThreeData} />
        </div>
      )}

      {/* Full Leaderboard Table */}
      {leaderboardData.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-title-lg font-semibold text-surface-900">
            Rangliste
          </h2>
          <LeaderboardTable users={leaderboardData} />
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && !loading && (
        <div className="rounded-2xl border border-surface-200 bg-white p-12 text-center shadow-card">
          <p className="text-body text-surface-500">
            Noch keine Daten vorhanden. Sammle XP, um im Leaderboard zu erscheinen!
          </p>
        </div>
      )}
    </div>
  );
}
