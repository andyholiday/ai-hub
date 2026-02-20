// =============================================================================
// Leaderboard Table Component
// Responsive ranking table with highlighted current user row
// =============================================================================

"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { Avatar, Badge } from "@/components/ui";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface LeaderboardUser {
  rank: number;
  name: string;
  avatarUrl?: string;
  department: string;
  level: number;
  levelTitle: string;
  xpTotal: number;
  xpPeriod: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardTableProps {
  users: LeaderboardUser[];
  className?: string;
}

// -----------------------------------------------------------------------------
// Rank Badge Styles
// -----------------------------------------------------------------------------

function getRankStyle(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-gradient-to-br from-lr-gold-400 to-lr-gold-600 text-white font-bold";
    case 2:
      return "bg-gradient-to-br from-surface-400 to-surface-500 text-white font-bold";
    case 3:
      return "bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold";
    default:
      return "bg-surface-100 text-surface-600 font-semibold";
  }
}

function getLevelBadgeVariant(level: number): "green" | "gold" | "blue" | "purple" {
  if (level >= 8) return "gold";
  if (level >= 6) return "purple";
  if (level >= 4) return "blue";
  return "green";
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function LeaderboardTable({ users, className }: LeaderboardTableProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-card",
        className
      )}
    >
      {/* Desktop Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]" role="table">
          <thead>
            <tr className="border-b border-surface-200 bg-surface-50">
              <th
                className="px-4 py-3 text-left text-overline font-semibold uppercase tracking-wider text-surface-500"
                scope="col"
              >
                Rang
              </th>
              <th
                className="px-4 py-3 text-left text-overline font-semibold uppercase tracking-wider text-surface-500"
                scope="col"
              >
                Mitarbeiter
              </th>
              <th
                className="hidden px-4 py-3 text-left text-overline font-semibold uppercase tracking-wider text-surface-500 md:table-cell"
                scope="col"
              >
                Abteilung
              </th>
              <th
                className="hidden px-4 py-3 text-left text-overline font-semibold uppercase tracking-wider text-surface-500 sm:table-cell"
                scope="col"
              >
                Level
              </th>
              <th
                className="px-4 py-3 text-right text-overline font-semibold uppercase tracking-wider text-surface-500"
                scope="col"
              >
                XP Gesamt
              </th>
              <th
                className="hidden px-4 py-3 text-right text-overline font-semibold uppercase tracking-wider text-surface-500 lg:table-cell"
                scope="col"
              >
                XP Zeitraum
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {users.map((user) => (
              <tr
                key={user.rank}
                className={cn(
                  "transition-colors duration-150",
                  user.isCurrentUser
                    ? "bg-lr-green-50/60 hover:bg-lr-green-50"
                    : "hover:bg-surface-50"
                )}
              >
                {/* Rank */}
                <td className="px-4 py-3.5">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-body-sm",
                      getRankStyle(user.rank)
                    )}
                  >
                    {user.rank}
                  </div>
                </td>

                {/* User */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={user.name}
                      src={user.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className={cn(
                        "truncate font-heading text-body font-semibold text-surface-900",
                        user.isCurrentUser && "text-lr-green-700"
                      )}>
                        {user.name}
                        {user.isCurrentUser && (
                          <span className="ml-1.5 text-caption font-medium text-lr-green-600">(Du)</span>
                        )}
                      </p>
                      {/* Department shown on mobile */}
                      <p className="truncate text-caption text-surface-500 md:hidden">
                        {user.department}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Department */}
                <td className="hidden px-4 py-3.5 md:table-cell">
                  <span className="text-body-sm text-surface-600">
                    {user.department}
                  </span>
                </td>

                {/* Level */}
                <td className="hidden px-4 py-3.5 sm:table-cell">
                  <Badge
                    variant={getLevelBadgeVariant(user.level)}
                    size="sm"
                  >
                    Lvl {user.level}
                  </Badge>
                </td>

                {/* XP Total */}
                <td className="px-4 py-3.5 text-right">
                  <span className="font-heading text-body font-bold tabular-nums text-surface-900">
                    {user.xpTotal.toLocaleString("de-DE")}
                  </span>
                </td>

                {/* XP Period */}
                <td className="hidden px-4 py-3.5 text-right lg:table-cell">
                  <span className="text-body-sm font-medium tabular-nums text-lr-green-600">
                    +{user.xpPeriod.toLocaleString("de-DE")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
