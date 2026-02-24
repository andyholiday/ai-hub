// =============================================================================
// Topic List Sidebar
// Lists all radar items grouped by category with filter capabilities
// =============================================================================

"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  ThumbsUp,
} from "lucide-react";
import type {
  RadarCategory,
  RadarRing,
} from "@/lib/validators/innovation-radar";
import {
  CATEGORY_LABELS,
  RING_LABELS,
} from "@/lib/validators/innovation-radar";
import type { RadarItem } from "./radar-chart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopicListSidebarProps {
  items: RadarItem[];
  selectedItemId: string | null;
  highlightCategory: RadarCategory | null;
  onItemClick: (item: RadarItem) => void;
  onCategoryFilter: (category: RadarCategory | null) => void;
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

const CATEGORY_ORDER: RadarCategory[] = [
  "techniques",
  "tools",
  "platforms",
  "frameworks",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TopicListSidebar({
  items,
  selectedItemId,
  highlightCategory,
  onItemClick,
  onCategoryFilter,
}: TopicListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<RadarCategory>>(
    new Set(CATEGORY_ORDER),
  );

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  // Group by category
  const groupedItems = useMemo(() => {
    const groups: Record<RadarCategory, RadarItem[]> = {
      techniques: [],
      tools: [],
      platforms: [],
      frameworks: [],
    };

    for (const item of filteredItems) {
      groups[item.category].push(item);
    }

    // Sort each group by votes (descending)
    for (const category of CATEGORY_ORDER) {
      groups[category].sort((a, b) => b.votes_count - a.votes_count);
    }

    return groups;
  }, [filteredItems]);

  const toggleCategory = (category: RadarCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Determine if an item is "trending" (top 20% by votes)
  const trendingThreshold = useMemo(() => {
    if (items.length === 0) return 0;
    const sorted = [...items].sort((a, b) => b.votes_count - a.votes_count);
    const topIndex = Math.max(0, Math.ceil(sorted.length * 0.2) - 1);
    return sorted[topIndex]?.votes_count ?? 0;
  }, [items]);

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="p-4 pb-2">
        <Input
          placeholder="Topics durchsuchen..."
          prefixIcon={<Search />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="sm"
        />
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
        <button
          onClick={() => onCategoryFilter(null)}
          className={cn(
            "rounded-full px-2.5 py-1 text-overline font-medium transition-colors",
            !highlightCategory
              ? "bg-brand-primary-500 text-white"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200",
          )}
        >
          Alle
        </button>
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              onCategoryFilter(highlightCategory === cat ? null : cat)
            }
            className={cn(
              "rounded-full px-2.5 py-1 text-overline font-medium transition-colors",
              highlightCategory === cat
                ? "bg-brand-primary-500 text-white"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200",
            )}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {CATEGORY_ORDER.map((category) => {
          const categoryItems = groupedItems[category];
          const isExpanded = expandedCategories.has(category);

          if (
            highlightCategory &&
            highlightCategory !== category
          ) {
            return null;
          }

          return (
            <div key={category} className="mb-2">
              {/* Category header */}
              <button
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-100"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-surface-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-surface-400" />
                )}
                <span className="flex-1 text-body-sm font-semibold text-surface-800">
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="text-caption text-surface-400">
                  {categoryItems.length}
                </span>
              </button>

              {/* Items */}
              {isExpanded && (
                <div className="ml-2 space-y-0.5">
                  {categoryItems.length === 0 && (
                    <p className="px-4 py-2 text-caption text-surface-400">
                      Keine Topics gefunden
                    </p>
                  )}
                  {categoryItems.map((item) => {
                    const isTrending =
                      item.votes_count >= trendingThreshold &&
                      trendingThreshold > 0;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onItemClick(item)}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors",
                          selectedItemId === item.id
                            ? "bg-brand-primary-50 ring-1 ring-inset ring-brand-primary-200"
                            : "hover:bg-surface-50",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "text-body-sm font-medium line-clamp-1",
                                selectedItemId === item.id
                                  ? "text-brand-primary-700"
                                  : "text-surface-800",
                              )}
                            >
                              {item.title}
                            </span>
                            {isTrending && (
                              <TrendingUp className="h-3 w-3 shrink-0 text-error" />
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge
                              variant={RING_BADGE_VARIANTS[item.ring]}
                              size="sm"
                            >
                              {RING_LABELS[item.ring]}
                            </Badge>
                            <span className="flex items-center gap-0.5 text-overline text-surface-400">
                              <ThumbsUp className="h-3 w-3" />
                              {item.votes_count}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty search state */}
        {filteredItems.length === 0 && searchQuery.trim() && (
          <div className="px-4 py-8 text-center">
            <Search className="mx-auto h-8 w-8 text-surface-300" />
            <p className="mt-2 text-body-sm text-surface-500">
              Keine Topics fuer &quot;{searchQuery}&quot; gefunden
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
