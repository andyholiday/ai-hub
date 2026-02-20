// =============================================================================
// XpProgress Component
// XP progress bar with level badges and animated fill
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import { Rocket, Zap, Flame, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface XpProgressProps {
  /** Current XP amount */
  currentXp?: number;
  /** XP required for next level */
  maxXp?: number;
  /** Current level number */
  currentLevel?: number;
  /** Title of the current level */
  currentLevelTitle?: string;
  /** Title of the next level */
  nextLevelTitle?: string;
  /** Next level number */
  nextLevel?: number;
  className?: string;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function XpProgress({
  currentXp = 2340,
  maxXp = 3000,
  currentLevel: _currentLevel = 4,
  currentLevelTitle = "AI Innovator",
  nextLevelTitle = "AI Champion",
  nextLevel = 5,
  className,
}: XpProgressProps) {
  const [animated, setAnimated] = useState(false);
  const percentage = Math.min(100, Math.max(0, (currentXp / maxXp) * 100));
  const remaining = maxXp - currentXp;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

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
            {currentLevelTitle}
          </span>

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
            {nextLevelTitle}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="mt-5 h-2.5 w-full overflow-hidden rounded-lg bg-surface-200"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`XP Fortschritt: ${currentXp} von ${maxXp}`}
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
            {currentXp.toLocaleString("de-DE")}
          </span>{" "}
          / {maxXp.toLocaleString("de-DE")} XP
        </div>
        <div>
          Noch{" "}
          <span className="font-semibold text-lr-green-500">
            {remaining.toLocaleString("de-DE")} XP
          </span>{" "}
          bis Level {nextLevel}
        </div>
      </div>
    </div>
  );
}
