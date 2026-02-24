// =============================================================================
// Trending Topics Component
// Top 5 trending topics as horizontal card strip
// =============================================================================

"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ThumbsUp } from "lucide-react";
import type { RadarRing } from "@/lib/validators/innovation-radar";
import {
  CATEGORY_LABELS,
  RING_LABELS,
} from "@/lib/validators/innovation-radar";
import type { RadarItem } from "./radar-chart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrendingTopicsProps {
  items: RadarItem[];
  onItemClick: (item: RadarItem) => void;
  selectedItemId: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RING_BADGE_VARIANTS: Record<RadarRing, "green" | "blue" | "gold" | "red"> = {
  adopt: "green",
  trial: "blue",
  assess: "gold",
  hold: "red",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrendingTopics({
  items,
  onItemClick,
  selectedItemId,
}: TrendingTopicsProps) {
  // Get top 5 by votes
  const trendingItems = useMemo(() => {
    return [...items]
      .sort((a, b) => b.votes_count - a.votes_count)
      .slice(0, 5);
  }, [items]);

  const maxVotes = useMemo(
    () => Math.max(1, ...trendingItems.map((i) => i.votes_count)),
    [trendingItems],
  );

  if (trendingItems.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-error" />
        <h3 className="font-heading text-title-sm font-semibold text-surface-900">
          Trending Topics
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {trendingItems.map((item, index) => {
          const voteBarWidth =
            maxVotes > 0 ? (item.votes_count / maxVotes) * 100 : 0;
          const isSelected = selectedItemId === item.id;

          return (
            <Card
              key={item.id}
              hoverable
              className={cn(
                "cursor-pointer p-4",
                isSelected && "ring-2 ring-brand-primary-500",
              )}
              onClick={() => onItemClick(item)}
            >
              {/* Rank indicator */}
              <div className="flex items-start justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-100 text-caption font-bold text-surface-500">
                  {index + 1}
                </span>
                <Badge variant={RING_BADGE_VARIANTS[item.ring]} size="sm">
                  {RING_LABELS[item.ring]}
                </Badge>
              </div>

              {/* Title */}
              <h4 className="mt-2 font-heading text-body-sm font-semibold text-surface-900 line-clamp-2">
                {item.title}
              </h4>

              {/* Category */}
              <p className="mt-1 text-caption text-surface-500">
                {CATEGORY_LABELS[item.category]}
              </p>

              {/* Vote bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-caption text-surface-400">
                    <ThumbsUp className="h-3 w-3" />
                    <span>{item.votes_count}</span>
                  </div>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-200">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      item.ring === "adopt"
                        ? "bg-brand-primary-500"
                        : item.ring === "trial"
                          ? "bg-info"
                          : item.ring === "assess"
                            ? "bg-warning"
                            : "bg-error",
                    )}
                    style={{ width: `${voteBarWidth}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
