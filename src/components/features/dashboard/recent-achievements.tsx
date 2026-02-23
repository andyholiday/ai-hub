// =============================================================================
// Recent Achievements Component
// Shows the last 3 unlocked achievements on the dashboard.
// Links to the full achievements page for more details.
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface RecentAchievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  unlockedAt: string | null;
}

interface RecentAchievementsProps {
  className?: string;
}

// -----------------------------------------------------------------------------
// Icon Map (simplified mapping of icon names to emoji/symbols)
// -----------------------------------------------------------------------------

const ICON_MAP: Record<string, string> = {
  footprints: "\u{1F463}",
  "book-open": "\u{1F4D6}",
  "graduation-cap": "\u{1F393}",
  library: "\u{1F4DA}",
  crown: "\u{1F451}",
  star: "\u{2B50}",
  "message-circle": "\u{1F4AC}",
  messages: "\u{1F5E8}\u{FE0F}",
  heart: "\u{2764}\u{FE0F}",
  "trending-up": "\u{1F4C8}",
  flame: "\u{1F525}",
  zap: "\u{26A1}",
  rocket: "\u{1F680}",
  award: "\u{1F3C6}",
  medal: "\u{1F3C5}",
  shield: "\u{1F6E1}\u{FE0F}",
  "shield-check": "\u{2705}",
  sparkles: "\u{2728}",
  coins: "\u{1FA99}",
  gem: "\u{1F48E}",
  trophy: "\u{1F3C6}",
};

function getIconEmoji(iconName: string): string {
  return ICON_MAP[iconName] ?? "\u{1F3C6}";
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function RecentAchievements({ className }: RecentAchievementsProps) {
  const [achievements, setAchievements] = useState<RecentAchievement[]>([]);
  const [summary, setSummary] = useState({ total: 0, unlocked: 0 });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchRecentAchievements();
  }, []);

  async function fetchRecentAchievements() {
    try {
      const res = await fetch("/api/gamification/achievements");
      const json = await res.json();

      if (json.data) {
        setSummary(json.data.summary);

        // Flatten all achievements and get the last 3 unlocked
        const allAchievements: RecentAchievement[] = json.data.grouped
          .flatMap((group: { achievements: RecentAchievement[] }) => group.achievements)
          .filter((a: RecentAchievement) => a.unlockedAt !== null)
          .sort(
            (a: RecentAchievement, b: RecentAchievement) =>
              new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime(),
          )
          .slice(0, 3);

        setAchievements(allAchievements);
      }
    } catch {
      // Silently fail - this is a non-critical dashboard widget
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={cn(
        "rounded-[14px] border border-surface-200 bg-white p-5 shadow-card",
        "transition-all duration-300 ease-out",
        "translate-y-2 opacity-0",
        mounted && "translate-y-0 opacity-100",
        className,
      )}
    >
      {/* Section Title */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold text-surface-900">
          <span
            className="h-4 w-[3px] rounded-full bg-amber-400"
            aria-hidden="true"
          />
          Achievements
        </h3>
        <span className="text-[11px] font-bold tabular-nums text-surface-400">
          {summary.unlocked}/{summary.total}
        </span>
      </div>

      {/* Achievement Items */}
      <div className="mt-3 flex flex-col divide-y divide-surface-100">
        {loading ? (
          // Skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2.5 animate-pulse">
              <div className="h-9 w-9 rounded-lg bg-surface-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded bg-surface-100" />
                <div className="h-2.5 w-16 rounded bg-surface-100" />
              </div>
            </div>
          ))
        ) : achievements.length > 0 ? (
          achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center gap-2.5 py-2.5 first:pt-0 last:pb-0"
            >
              {/* Icon */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50">
                <span className="text-base" aria-hidden="true">
                  {getIconEmoji(achievement.icon)}
                </span>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="truncate text-caption font-semibold text-surface-900">
                  {achievement.title}
                </div>
                <div className="text-[10px] font-medium text-amber-500">
                  +{achievement.xpReward} XP
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center gap-2.5 py-4">
            <Lock className="h-4 w-4 text-surface-300" />
            <span className="text-caption text-surface-400">
              Noch keine Achievements freigeschaltet
            </span>
          </div>
        )}
      </div>

      {/* Link to Full Page */}
      <Link
        href="/profile/achievements"
        className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-surface-50 px-3 py-2 text-[11px] font-semibold text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
      >
        <Trophy className="h-3.5 w-3.5" />
        Alle Achievements ansehen
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
