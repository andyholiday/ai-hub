// =============================================================================
// Level Display Component
// Shows the current level with icon, XP progress bar, and next level preview
// =============================================================================

"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";
import { ProgressBar, Badge } from "@/components/ui";
import { LEVELS, type LevelDefinition } from "@/constants/gamification";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface LevelDisplayProps {
  currentXP: number;
  className?: string;
}

// -----------------------------------------------------------------------------
// Level Icon SVGs
// -----------------------------------------------------------------------------

function LightningIcon({ className }: { className?: string }) {
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
        d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
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
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function getCurrentLevel(xp: number): LevelDefinition {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]!.minXP) return LEVELS[i]!;
  }
  return LEVELS[0]!;
}

function getNextLevel(currentLevel: LevelDefinition): LevelDefinition | null {
  const idx = LEVELS.findIndex((l) => l.level === currentLevel.level);
  if (idx < LEVELS.length - 1) return LEVELS[idx + 1]!;
  return null;
}

function getLevelIconColor(level: number): string {
  if (level >= 8) return "text-lr-gold-500";
  if (level >= 6) return "text-purple-500";
  if (level >= 4) return "text-lr-green-500";
  return "text-info";
}

function getLevelBgColor(level: number): string {
  if (level >= 8) return "bg-lr-gold-50 ring-lr-gold-200";
  if (level >= 6) return "bg-purple-50 ring-purple-200";
  if (level >= 4) return "bg-lr-green-50 ring-lr-green-200";
  return "bg-info-light ring-blue-200";
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function LevelDisplay({ currentXP, className }: LevelDisplayProps) {
  const current = getCurrentLevel(currentXP);
  const next = getNextLevel(current);

  const xpInLevel = currentXP - current.minXP;
  const xpForLevel = current.maxXP === Infinity ? xpInLevel : current.maxXP - current.minXP;
  const progressPercent =
    current.maxXP === Infinity ? 100 : Math.round((xpInLevel / xpForLevel) * 100);

  return (
    <div
      className={cn(
        "rounded-2xl border border-surface-200 bg-white p-5 shadow-card sm:p-6",
        className
      )}
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        {/* Level Icon */}
        <div
          className={cn(
            "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl ring-2",
            getLevelBgColor(current.level)
          )}
        >
          {current.level >= 7 ? (
            <StarIcon
              className={cn("h-10 w-10", getLevelIconColor(current.level))}
            />
          ) : (
            <LightningIcon
              className={cn("h-10 w-10", getLevelIconColor(current.level))}
            />
          )}
        </div>

        {/* Level Info */}
        <div className="flex-1 text-center sm:text-left w-full">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <h3 className="font-heading text-headline-sm font-bold text-surface-900">
              Level {current.level}
            </h3>
            <Badge
              variant={current.level >= 8 ? "gold" : current.level >= 6 ? "purple" : "green"}
              size="md"
            >
              {current.title}
            </Badge>
          </div>

          {/* XP Info */}
          <p className="mt-2 text-body-sm text-surface-500">
            <span className="font-semibold tabular-nums text-surface-900">
              {currentXP.toLocaleString("de-DE")}
            </span>{" "}
            XP gesammelt
            {next && (
              <>
                {" "}&middot;{" "}
                <span className="tabular-nums">
                  {(next.minXP - currentXP).toLocaleString("de-DE")}
                </span>{" "}
                XP bis Level {next.level}
              </>
            )}
          </p>

          {/* Progress Bar */}
          <div className="mt-4">
            <ProgressBar
              value={progressPercent}
              variant="gradient"
              size="md"
              showLabel
              label={
                next
                  ? `${xpInLevel.toLocaleString("de-DE")} / ${xpForLevel.toLocaleString("de-DE")} XP`
                  : "Max Level erreicht"
              }
            />
          </div>

          {/* Next Level Preview */}
          {next && (
            <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
              <span className="text-caption text-surface-400">Naechstes Level:</span>
              <Badge variant="gray" size="sm">
                Lvl {next.level} &ndash; {next.title}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
