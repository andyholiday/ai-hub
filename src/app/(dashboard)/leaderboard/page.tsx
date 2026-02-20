// =============================================================================
// Leaderboard Page
// Ranking overview with top 3 podium, stats, and full leaderboard table
// =============================================================================

"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { StatCard } from "@/components/ui";
import {
  TopThree,
  LeaderboardTable,
  type TopThreeUser,
  type LeaderboardUser,
} from "@/components/features/gamification";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type Period = "week" | "month" | "all";

// -----------------------------------------------------------------------------
// Demo Data
// -----------------------------------------------------------------------------

const CURRENT_USER_NAME = "Sarah Hoffmann";

const leaderboardData: LeaderboardUser[] = [
  {
    rank: 1,
    name: "Lisa Peters",
    department: "Produktentwicklung",
    level: 9,
    levelTitle: "KI-Virtuose",
    xpTotal: 5200,
    xpPeriod: 320,
  },
  {
    rank: 2,
    name: "Markus Koenig",
    department: "Marketing",
    level: 9,
    levelTitle: "KI-Virtuose",
    xpTotal: 4800,
    xpPeriod: 280,
  },
  {
    rank: 3,
    name: "Julia Richter",
    department: "HR",
    level: 8,
    levelTitle: "KI-Meister",
    xpTotal: 3900,
    xpPeriod: 245,
  },
  {
    rank: 4,
    name: "Thomas Wagner",
    department: "IT",
    level: 8,
    levelTitle: "KI-Meister",
    xpTotal: 3200,
    xpPeriod: 190,
  },
  {
    rank: 5,
    name: "Anna Mueller",
    department: "Finance",
    level: 7,
    levelTitle: "KI-Spezialist",
    xpTotal: 2800,
    xpPeriod: 175,
  },
  {
    rank: 6,
    name: "David Schneider",
    department: "Logistik",
    level: 7,
    levelTitle: "KI-Spezialist",
    xpTotal: 2500,
    xpPeriod: 155,
  },
  {
    rank: 7,
    name: CURRENT_USER_NAME,
    department: "Vertrieb",
    level: 7,
    levelTitle: "KI-Spezialist",
    xpTotal: 2340,
    xpPeriod: 140,
    isCurrentUser: true,
  },
  {
    rank: 8,
    name: "Michael Braun",
    department: "Einkauf",
    level: 6,
    levelTitle: "KI-Experte",
    xpTotal: 2100,
    xpPeriod: 120,
  },
  {
    rank: 9,
    name: "Laura Fischer",
    department: "Qualitaet",
    level: 6,
    levelTitle: "KI-Experte",
    xpTotal: 1950,
    xpPeriod: 105,
  },
  {
    rank: 10,
    name: "Christian Weber",
    department: "Kundenservice",
    level: 5,
    levelTitle: "KI-Kenner",
    xpTotal: 1800,
    xpPeriod: 90,
  },
];

const topThreeData: TopThreeUser[] = leaderboardData.slice(0, 3).map((u) => ({
  rank: u.rank as 1 | 2 | 3,
  name: u.name,
  xp: u.xpTotal,
  level: u.level,
  levelTitle: u.levelTitle,
  department: u.department,
}));

// Current user data for stats
const currentUser = leaderboardData.find((u) => u.isCurrentUser)!;

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
// Page Component
// -----------------------------------------------------------------------------

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("month");

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
          value={`#${currentUser.rank}`}
          change="+2 Plaetze"
          changeDirection="up"
          icon={<RankIcon />}
          iconVariant="green"
        />
        <StatCard
          label="Deine XP"
          value={currentUser.xpTotal.toLocaleString("de-DE")}
          change={`+${currentUser.xpPeriod} diese Woche`}
          changeDirection="up"
          icon={<XPIcon />}
          iconVariant="gold"
        />
        <StatCard
          label="Dein Level"
          value={`Lvl ${currentUser.level}`}
          change={currentUser.levelTitle}
          changeDirection="neutral"
          icon={<LevelIcon />}
          iconVariant="purple"
        />
        <StatCard
          label="Aktive User"
          value="142"
          change="+12 diese Woche"
          changeDirection="up"
          icon={<UsersIcon />}
          iconVariant="blue"
        />
      </div>

      {/* Top 3 Podium */}
      <div className="rounded-2xl border border-surface-200 bg-white p-4 shadow-card sm:p-6">
        <TopThree users={topThreeData} />
      </div>

      {/* Full Leaderboard Table */}
      <div>
        <h2 className="mb-3 font-heading text-title-lg font-semibold text-surface-900">
          Rangliste
        </h2>
        <LeaderboardTable users={leaderboardData} />
      </div>
    </div>
  );
}
