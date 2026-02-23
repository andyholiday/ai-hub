// =============================================================================
// DashboardStreak Component
// Wrapper around StreakWidget that fetches real data from DashboardDataProvider.
// =============================================================================

"use client";

import { cn } from "@/lib/utils/cn";
import { StreakWidget } from "@/components/features/gamification";
import { useDashboardContext } from "./dashboard-data-provider";

// -----------------------------------------------------------------------------
// Skeleton
// -----------------------------------------------------------------------------

function StreakSkeleton() {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-surface-200 bg-white p-5",
        "shadow-card animate-pulse"
      )}
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-surface-100" />
        <div className="flex-1">
          <div className="h-7 w-12 rounded bg-surface-200" />
          <div className="mt-1 h-3 w-16 rounded bg-surface-100" />
        </div>
      </div>

      {/* Dots skeleton */}
      <div className="mt-4 flex items-center justify-between gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-2.5 w-2.5 rounded-full bg-surface-200" />
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="mt-3 flex items-center justify-between border-t border-surface-100 pt-3">
        <div className="h-3 w-20 rounded bg-surface-100" />
        <div className="h-3 w-12 rounded bg-surface-100" />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function DashboardStreak() {
  const { data, isLoading, error } = useDashboardContext();

  if (isLoading) {
    return <StreakSkeleton />;
  }

  if (error || !data) {
    return null;
  }

  return (
    <StreakWidget
      currentStreak={data.streakDays}
      longestStreak={data.longestStreak}
    />
  );
}
