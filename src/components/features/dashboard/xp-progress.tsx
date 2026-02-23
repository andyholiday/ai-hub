// =============================================================================
// XpProgress Component
// XP progress bar with level badges and animated fill.
// Fetches real data via DashboardDataProvider context.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { Rocket, Zap, Flame, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useDashboardContext } from "./dashboard-data-provider";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface XpProgressProps {
  className?: string;
}

// -----------------------------------------------------------------------------
// Skeleton
// -----------------------------------------------------------------------------

function XpProgressSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-surface-200 bg-white p-6 shadow-card animate-pulse",
        className
      )}
    >
      {/* Header skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="h-5 w-36 rounded bg-surface-200" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 rounded-lg bg-surface-100" />
          <div className="h-4 w-4 rounded bg-surface-100" />
          <div className="h-8 w-28 rounded-lg bg-surface-100" />
        </div>
      </div>

      {/* Progress bar skeleton */}
      <div className="mt-5 h-2.5 w-full rounded-lg bg-surface-200" />

      {/* Details skeleton */}
      <div className="mt-2 flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-surface-100" />
        <div className="h-3 w-32 rounded bg-surface-100" />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function XpProgress({ className }: XpProgressProps) {
  const [animated, setAnimated] = useState(false);
  const { data, isLoading, error } = useDashboardContext();

  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => setAnimated(true), 300);
      return () => clearTimeout(timer);
    }
  }, [data]);

  // Loading state
  if (isLoading) {
    return <XpProgressSkeleton className={className} />;
  }

  // Error state -- hidden since StatsGrid already shows the error
  if (error || !data) {
    return null;
  }

  const { levelInfo, xpTotal } = data;
  const { currentLevel, nextLevel, percentage } = levelInfo;

  // Display values
  const currentXpDisplay = xpTotal;
  const maxXpDisplay = currentLevel.maxXP === Infinity ? xpTotal : currentLevel.maxXP;
  const remaining = Math.max(0, maxXpDisplay - xpTotal);
  const isMaxLevel = nextLevel === null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-surface-200 bg-white p-6 shadow-card",
        "animate-fade-up",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-surface-900">
          <Rocket className="h-4.5 w-4.5 text-lr-green-500" aria-hidden="true" />
          Dein Fortschritt
        </h3>

        {/* Level Badges */}
        <div className="flex items-center gap-2">
          {/* Current Level */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5",
              "bg-lr-green-50 text-caption font-bold text-lr-green-600"
            )}
          >
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            {currentLevel.title}
          </span>

          {nextLevel && (
            <>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-surface-400"
                aria-hidden="true"
              />

              {/* Next Level */}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5",
                  "bg-orange-50 text-caption font-bold text-amber-500 opacity-80"
                )}
              >
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                {nextLevel.title}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="mt-5 h-2.5 w-full overflow-hidden rounded-lg bg-surface-200"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`XP Fortschritt: ${currentXpDisplay.toLocaleString("de-DE")} von ${maxXpDisplay.toLocaleString("de-DE")}`}
      >
        <div
          className={cn(
            "h-full rounded-lg",
            "bg-gradient-to-r from-lr-green-500 to-lr-gold-500",
            "transition-all duration-1500 ease-smooth"
          )}
          style={{ width: animated ? `${percentage}%` : "0%" }}
        />
      </div>

      {/* Details */}
      <div className="mt-2 flex items-center justify-between text-caption text-surface-400">
        <div>
          <span className="font-semibold text-lr-green-500">
            {currentXpDisplay.toLocaleString("de-DE")}
          </span>{" "}
          / {maxXpDisplay.toLocaleString("de-DE")} XP
        </div>
        <div>
          {isMaxLevel ? (
            <span className="font-semibold text-lr-green-500">
              Maximales Level erreicht!
            </span>
          ) : (
            <>
              Noch{" "}
              <span className="font-semibold text-lr-green-500">
                {remaining.toLocaleString("de-DE")} XP
              </span>{" "}
              bis Level {nextLevel.level}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
