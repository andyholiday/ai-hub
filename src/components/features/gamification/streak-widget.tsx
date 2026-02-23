// =============================================================================
// Streak Widget Component
// Displays the current login streak with flame animation and color escalation.
// Compact design for dashboard sidebar or header placement.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface StreakWidgetProps {
  /** Current login streak in days */
  currentStreak: number;
  /** Longest ever streak in days */
  longestStreak: number;
  /** Optional additional class names */
  className?: string;
}

// -----------------------------------------------------------------------------
// Streak Tier Configuration
// -----------------------------------------------------------------------------

interface StreakTier {
  minDays: number;
  label: string;
  flameColor: string;
  flameBg: string;
  textColor: string;
  borderColor: string;
  glowColor: string;
}

const STREAK_TIERS: StreakTier[] = [
  {
    minDays: 30,
    label: "Legendaer",
    flameColor: "text-amber-400",
    flameBg: "bg-gradient-to-br from-amber-50 via-purple-50 to-amber-50",
    textColor: "text-amber-500",
    borderColor: "border-amber-200",
    glowColor: "shadow-[0_0_20px_rgba(245,158,11,0.15)]",
  },
  {
    minDays: 14,
    label: "On Fire",
    flameColor: "text-red-500",
    flameBg: "bg-red-50",
    textColor: "text-red-500",
    borderColor: "border-red-200",
    glowColor: "shadow-[0_0_15px_rgba(239,68,68,0.1)]",
  },
  {
    minDays: 7,
    label: "Gut dabei",
    flameColor: "text-orange-500",
    flameBg: "bg-orange-50",
    textColor: "text-orange-500",
    borderColor: "border-orange-200",
    glowColor: "",
  },
  {
    minDays: 0,
    label: "Anfang",
    flameColor: "text-surface-400",
    flameBg: "bg-surface-50",
    textColor: "text-surface-500",
    borderColor: "border-surface-200",
    glowColor: "",
  },
];

function getStreakTier(days: number): StreakTier {
  for (const tier of STREAK_TIERS) {
    if (days >= tier.minDays) return tier;
  }
  return STREAK_TIERS[STREAK_TIERS.length - 1]!;
}

// -----------------------------------------------------------------------------
// Flame SVG Icon
// -----------------------------------------------------------------------------

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.177A7.547 7.547 0 016.648 6.61a.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248zM15.75 14.25a3.75 3.75 0 11-7.313-1.172c.628.465 1.35.81 2.133 1a5.99 5.99 0 011.925-3.545 3.75 3.75 0 013.255 3.717z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function StreakWidget({
  currentStreak,
  longestStreak,
  className,
}: StreakWidgetProps) {
  const [mounted, setMounted] = useState(false);
  const tier = getStreakTier(currentStreak);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "rounded-[14px] border bg-white p-5 shadow-card",
        "transition-all duration-300 ease-out",
        tier.borderColor,
        tier.glowColor,
        // Fade-in animation
        "translate-y-2 opacity-0",
        mounted && "translate-y-0 opacity-100",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Flame Icon Circle */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            tier.flameBg,
          )}
        >
          <FlameIcon
            className={cn(
              "h-6 w-6 transition-transform duration-500",
              tier.flameColor,
              currentStreak >= 7 && "animate-pulse",
            )}
          />
        </div>

        {/* Streak Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                "font-display text-[28px] font-bold tabular-nums leading-none",
                tier.textColor,
              )}
            >
              {currentStreak}
            </span>
            <span className="text-caption font-medium text-surface-500">
              {currentStreak === 1 ? "Tag" : "Tage"}
            </span>
          </div>
          <span
            className={cn(
              "mt-0.5 inline-block text-[10px] font-bold uppercase tracking-[1px]",
              tier.textColor,
            )}
          >
            {tier.label}
          </span>
        </div>
      </div>

      {/* Streak Dots Visualization (last 7 days) */}
      <div className="mt-4 flex items-center justify-between gap-1">
        {Array.from({ length: 7 }).map((_, i) => {
          const dayIndex = 6 - i;
          const isActive = dayIndex < currentStreak;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-300",
                  isActive
                    ? currentStreak >= 30
                      ? "bg-amber-400"
                      : currentStreak >= 14
                        ? "bg-red-400"
                        : currentStreak >= 7
                          ? "bg-orange-400"
                          : "bg-surface-300"
                    : "bg-surface-200",
                )}
                style={{
                  transitionDelay: mounted ? `${i * 50}ms` : "0ms",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Longest Streak */}
      <div className="mt-3 flex items-center justify-between border-t border-surface-100 pt-3">
        <span className="text-[11px] font-medium text-surface-400">
          Laengste Streak
        </span>
        <span className="text-[11px] font-bold tabular-nums text-surface-600">
          {longestStreak} {longestStreak === 1 ? "Tag" : "Tage"}
        </span>
      </div>
    </div>
  );
}
