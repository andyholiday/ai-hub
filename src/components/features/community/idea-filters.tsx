"use client";

// =============================================================================
// Idea Filters Component
// Sort and search controls for the Idea Board page.
// =============================================================================

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IdeaSortOption = "most_upvoted" | "newest" | "most_commented";

export interface IdeaFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sort: IdeaSortOption;
  onSortChange: (sort: IdeaSortOption) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SORT_OPTIONS: { value: IdeaSortOption; label: string }[] = [
  { value: "most_upvoted", label: "Beliebteste" },
  { value: "newest", label: "Neueste" },
  { value: "most_commented", label: "Meiste Kommentare" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IdeaFilters({
  search,
  onSearchChange,
  sort,
  onSortChange,
}: IdeaFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search */}
      <div className="flex-1">
        <Input
          placeholder="Ideen durchsuchen..."
          prefixIcon={<Search />}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          size="sm"
        />
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-body-sm text-surface-500">Sortieren:</span>
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onSortChange(option.value)}
            className={`rounded-lg px-3 py-1 text-caption font-medium transition-colors ${
              sort === option.value
                ? "bg-brand-accent-50 text-brand-accent-800"
                : "text-surface-500 hover:text-surface-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
