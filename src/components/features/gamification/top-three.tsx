// =============================================================================
// Top Three Podium Component
// Displays the top 3 leaderboard users in a podium layout
// =============================================================================

"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Avatar, Badge } from "@/components/ui";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface TopThreeUser {
  rank: 1 | 2 | 3;
  name: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  levelTitle: string;
  department: string;
}

export interface TopThreeProps {
  users: TopThreeUser[];
  className?: string;
}

// -----------------------------------------------------------------------------
// Medal Icons (SVG)
// -----------------------------------------------------------------------------

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm0 2h14v2H5v-2z" />
    </svg>
  );
}

function MedalIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6zM7 2h10l-1.5 4h-7L7 2z" />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Rank Configuration
// -----------------------------------------------------------------------------

const rankConfig: Record<
  1 | 2 | 3,
  {
    containerClass: string;
    ringClass: string;
    accentColor: string;
    bgGlow: string;
    label: string;
    badgeVariant: "gold" | "gray" | "blue";
    avatarSize: string;
    iconColor: string;
  }
> = {
  1: {
    containerClass: "order-2 z-10 -mt-4 sm:-mt-6",
    ringClass: "ring-4 ring-brand-accent-400",
    accentColor: "from-brand-accent-400 to-brand-accent-600",
    bgGlow: "shadow-brand-accent",
    label: "1. Platz",
    badgeVariant: "gold",
    avatarSize: "h-20 w-20 sm:h-24 sm:w-24",
    iconColor: "text-brand-accent-500",
  },
  2: {
    containerClass: "order-1",
    ringClass: "ring-4 ring-surface-400",
    accentColor: "from-surface-400 to-surface-500",
    bgGlow: "shadow-card-hover",
    label: "2. Platz",
    badgeVariant: "gray",
    avatarSize: "h-16 w-16 sm:h-20 sm:w-20",
    iconColor: "text-surface-500",
  },
  3: {
    containerClass: "order-3",
    ringClass: "ring-4 ring-orange-400",
    accentColor: "from-orange-400 to-orange-600",
    bgGlow: "shadow-card-hover",
    label: "3. Platz",
    badgeVariant: "gold",
    avatarSize: "h-16 w-16 sm:h-20 sm:w-20",
    iconColor: "text-orange-500",
  },
};

// -----------------------------------------------------------------------------
// Podium Card Sub-component
// -----------------------------------------------------------------------------

function PodiumCard({ user }: { user: TopThreeUser }) {
  const config = rankConfig[user.rank];

  return (
    <div
      className={cn(
        "flex flex-col items-center",
        config.containerClass
      )}
    >
      {/* Card */}
      <div
        className={cn(
          "relative flex w-full max-w-[220px] flex-col items-center",
          "rounded-2xl border border-surface-200 bg-white p-5 pt-14 sm:p-6 sm:pt-16",
          "transition-all duration-300",
          config.bgGlow
        )}
      >
        {/* Avatar positioned above card */}
        <div className="absolute -top-10 sm:-top-12">
          {/* Medal / Crown Icon */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
            {user.rank === 1 ? (
              <CrownIcon className={cn("h-7 w-7 sm:h-8 sm:w-8", config.iconColor)} />
            ) : (
              <MedalIcon className={cn("h-6 w-6 sm:h-7 sm:w-7", config.iconColor)} />
            )}
          </div>

          {/* Avatar */}
          <div
            className={cn(
              "relative overflow-hidden rounded-full",
              config.avatarSize,
              config.ringClass
            )}
          >
            <Avatar
              name={user.name}
              src={user.avatarUrl}
              size="lg"
              className={cn(
                "!h-full !w-full",
                "[&>div]:!h-full [&>div]:!w-full",
                "[&>div>span]:!text-headline-sm"
              )}
            />
          </div>
        </div>

        {/* Rank Number */}
        <div
          className={cn(
            "mb-2 flex h-7 w-7 items-center justify-center rounded-full",
            "bg-gradient-to-br font-heading text-body-sm font-bold text-white",
            config.accentColor
          )}
        >
          {user.rank}
        </div>

        {/* Name */}
        <h3 className="text-center font-heading text-title-sm font-semibold text-surface-900 truncate max-w-full">
          {user.name}
        </h3>

        {/* Department */}
        <p className="mt-0.5 text-center text-caption text-surface-500">
          {user.department}
        </p>

        {/* XP */}
        <p className="mt-3 font-heading text-headline-sm font-bold tabular-nums text-surface-900">
          {user.xp.toLocaleString("de-DE")} <span className="text-body-sm font-medium text-surface-500">XP</span>
        </p>

        {/* Level Badge */}
        <Badge
          variant={config.badgeVariant}
          size="sm"
          className="mt-2"
        >
          Lvl {user.level} - {user.levelTitle}
        </Badge>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function TopThree({ users, className }: TopThreeProps) {
  // Sort to ensure we have rank 1, 2, 3 in correct order
  const sorted = [...users].sort((a, b) => a.rank - b.rank);

  // We need at least the top 3
  if (sorted.length < 3) return null;

  return (
    <div
      className={cn(
        "flex items-end justify-center gap-3 sm:gap-5 pt-14 sm:pt-16 pb-4",
        className
      )}
      role="region"
      aria-label="Top 3 Rangliste"
    >
      {sorted.map((user) => (
        <PodiumCard key={user.rank} user={user} />
      ))}
    </div>
  );
}
