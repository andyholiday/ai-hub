// =============================================================================
// LeaderboardMini Component
// "Top der Woche" sidebar widget with rank indicators
// =============================================================================

"use client";

import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface LeaderEntry {
  rank: number;
  name: string;
  initials: string;
  avatarColor: string;
  department: string;
  xpGain: string;
  isCurrentUser?: boolean;
}

interface LeaderboardMiniProps {
  className?: string;
}

// -----------------------------------------------------------------------------
// Demo Data
// -----------------------------------------------------------------------------

const leaders: LeaderEntry[] = [
  {
    rank: 1,
    name: "Lisa Peters",
    initials: "LP",
    avatarColor: "bg-amber-500",
    department: "Produktentwicklung",
    xpGain: "+340 XP",
  },
  {
    rank: 2,
    name: "Markus Koenig",
    initials: "MK",
    avatarColor: "bg-blue-500",
    department: "Marketing",
    xpGain: "+285 XP",
  },
  {
    rank: 3,
    name: "Julia Richter",
    initials: "JR",
    avatarColor: "bg-pink-500",
    department: "HR",
    xpGain: "+210 XP",
  },
  {
    rank: 7,
    name: "Du (Sarah)",
    initials: "SH",
    avatarColor: "bg-lr-green-500",
    department: "Vertrieb",
    xpGain: "+120 XP",
    isCurrentUser: true,
  },
];

// -----------------------------------------------------------------------------
// Rank Color Map
// -----------------------------------------------------------------------------

function getRankColor(rank: number): string {
  switch (rank) {
    case 1:
      return "text-lr-gold-500";
    case 2:
      return "text-surface-400";
    case 3:
      return "text-orange-600";
    default:
      return "text-surface-400";
  }
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function LeaderboardMini({ className }: LeaderboardMiniProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-surface-200 bg-white p-5 shadow-card",
        "animate-fade-up",
        className
      )}
    >
      {/* Section Title */}
      <h3 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-surface-900">
        <span
          className="h-4 w-[3px] rounded-full bg-lr-green-500"
          aria-hidden="true"
        />
        Top der Woche
      </h3>

      {/* Leader Entries */}
      <div className="flex flex-col">
        {leaders.map((entry) => (
          <div
            key={entry.rank + entry.name}
            className={cn(
              "flex items-center gap-2.5 py-2",
              // Highlighted "Du" row
              entry.isCurrentUser && [
                "-mx-2 rounded-lg bg-lr-green-50 px-2",
              ]
            )}
          >
            {/* Rank */}
            <span
              className={cn(
                "w-5 text-center font-display text-body-sm font-bold",
                entry.isCurrentUser
                  ? "text-lr-green-500"
                  : getRankColor(entry.rank)
              )}
            >
              {entry.rank}
            </span>

            {/* Avatar */}
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px]",
                "text-[10px] font-semibold text-white",
                entry.avatarColor
              )}
              aria-hidden="true"
            >
              {entry.initials}
            </div>

            {/* Name & Department */}
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  "truncate text-caption font-semibold",
                  entry.isCurrentUser
                    ? "text-lr-green-600"
                    : "text-surface-900"
                )}
              >
                {entry.name}
              </div>
              <div className="text-[10px] text-surface-400">
                {entry.department}
              </div>
            </div>

            {/* XP Gain */}
            <span className="shrink-0 font-display text-caption font-semibold text-lr-green-500">
              {entry.xpGain}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
