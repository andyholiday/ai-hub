// =============================================================================
// Best Practices Overview Page
// Grid of Best Practice cards with category filters, search, and sorting
// =============================================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, ArrowUpDown, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  BestPracticeCard,
  CategoryFilter,
  type BestPracticeCardData,
  type CategoryFilterValue,
} from "@/components/features/best-practices";
import type { BestPracticeCategory as UiCategory } from "@/components/features/best-practices";

// -----------------------------------------------------------------------------
// Category Slug Mapping: DB -> UI
// API liefert snake_case, UI-Components erwarten kebab-case Deutsch
// -----------------------------------------------------------------------------

const DB_TO_UI_CATEGORY: Record<string, UiCategory> = {
  prompt_engineering: "prompt-engineering",
  ai_tools: "ki-tools",
  automation: "automatisierung",
  data_analysis: "datenanalyse",
  ai_ethics: "ki-ethik",
};

const UI_TO_DB_CATEGORY: Record<UiCategory, string> = {
  "prompt-engineering": "prompt_engineering",
  "ki-tools": "ai_tools",
  automatisierung: "automation",
  datenanalyse: "data_analysis",
  "ki-ethik": "ai_ethics",
};

// -----------------------------------------------------------------------------
// Sort Options
// -----------------------------------------------------------------------------

type SortOption = "newest" | "popular" | "upvotes";

const sortLabels: Record<SortOption, string> = {
  newest: "Neueste",
  popular: "Beliebteste",
  upvotes: "Meiste Upvotes",
};

const SORT_TO_API: Record<SortOption, string> = {
  newest: "newest",
  popular: "most_viewed",
  upvotes: "most_upvoted",
};

// -----------------------------------------------------------------------------
// API Response Type
// -----------------------------------------------------------------------------

interface ApiAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
}

interface ApiBestPractice {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  status: string;
  upvotes_count: number;
  views_count: number;
  comments_count: number;
  created_at: string;
  author: ApiAuthor;
}

interface ApiMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// -----------------------------------------------------------------------------
// Helper: map API item to Card data
// -----------------------------------------------------------------------------

function toCardData(item: ApiBestPractice): BestPracticeCardData {
  const uiCategory: UiCategory =
    DB_TO_UI_CATEGORY[item.category] ?? "prompt-engineering";

  const date = new Date(item.created_at);
  const createdAt = date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return {
    id: item.id,
    title: item.title,
    excerpt: item.excerpt ?? "",
    category: uiCategory,
    author: {
      name: item.author?.full_name ?? "Unbekannt",
      avatarUrl: item.author?.avatar_url ?? null,
      department: "",
    },
    createdAt,
    tags: item.tags ?? [],
    upvotes: item.upvotes_count,
    comments: item.comments_count,
    views: item.views_count,
    xpReward: 50,
  };
}

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function BestPracticesPage() {
  const [practices, setPractices] = useState<BestPracticeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [page, setPage] = useState(1);

  const [activeCategory, setActiveCategory] = useState<CategoryFilterValue>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const fetchPractices = useCallback(async (currentPage: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("status", "published");
      params.set("page", String(currentPage));
      params.set("pageSize", "20");
      params.set("sort", SORT_TO_API[sortBy]);

      if (activeCategory !== "all") {
        params.set("category", UI_TO_DB_CATEGORY[activeCategory]);
      }

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      const res = await fetch(`/api/best-practices?${params.toString()}`);

      if (res.status === 401 || res.status === 403) {
        window.location.href = "/login?redirectTo=/best-practices";
        return;
      }

      const json = await res.json();

      if (json.error) {
        setError(json.error.message ?? "Unbekannter Fehler");
        return;
      }

      setPractices((json.data ?? []).map(toCardData));
      setMeta(json.meta ?? null);
    } catch {
      setError("Best Practices konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, searchQuery, sortBy]);

  useEffect(() => {
    fetchPractices(page);
  }, [fetchPractices, page]);

  return (
    <div className="animate-fade-in">
      {/* ------------------------------------------------------------------ */}
      {/* Page Header */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-headline-sm font-bold text-surface-900 sm:text-headline">
            Best Practices
          </h1>
          <p className="mt-1 text-body text-surface-500">
            Entdecke bewaehrte KI-Strategien und teile dein Wissen mit der Community.
          </p>
        </div>
        <Link href="/best-practices/new">
          <Button iconLeft={<Plus />} size="lg">
            Neue Best Practice
          </Button>
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Category Filter */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-6">
        <CategoryFilter value={activeCategory} onChange={setActiveCategory} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Search + Sort Bar */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Best Practices durchsuchen..."
            prefixIcon={<Search />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="md"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="md"
            iconLeft={<ArrowUpDown />}
            onClick={() => setSortMenuOpen(!sortMenuOpen)}
          >
            {sortLabels[sortBy]}
          </Button>

          {sortMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setSortMenuOpen(false)}
              />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-surface-200 bg-white py-1 shadow-elevated">
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option);
                      setSortMenuOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center px-4 py-2.5 text-body-sm transition-colors duration-150",
                      sortBy === option
                        ? "bg-brand-primary-50 font-semibold text-brand-primary-700"
                        : "text-surface-600 hover:bg-surface-50"
                    )}
                  >
                    {sortLabels[option]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error State */}
      {/* ------------------------------------------------------------------ */}
      {error && (
        <Card className="mt-5 border-error bg-error-light p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-body-sm text-error-dark">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchPractices(page)}
            >
              Erneut versuchen
            </Button>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Loading State */}
      {/* ------------------------------------------------------------------ */}
      {isLoading && (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary-500" />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Results */}
      {/* ------------------------------------------------------------------ */}
      {!isLoading && !error && (
        <>
          {/* Results Count */}
          <div className="mt-5 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-accent-500" />
            <span className="text-body-sm text-surface-500">
              {meta?.totalCount ?? practices.length}{" "}
              {(meta?.totalCount ?? practices.length) === 1
                ? "Best Practice"
                : "Best Practices"}{" "}
              gefunden
            </span>
          </div>

          {/* Empty State */}
          {practices.length === 0 ? (
            <div className="mt-8 rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50/50 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary-100 shadow-sm">
                <Sparkles className="h-8 w-8 text-brand-primary-600" />
              </div>
              <h3 className="font-heading text-title-md font-semibold text-surface-900">
                {searchQuery || activeCategory !== "all"
                  ? "Keine passenden Best Practices gefunden"
                  : "Noch keine Best Practices verfuegbar. Schreibe die erste!"}
              </h3>
              <p className="mx-auto mb-6 mt-2 max-w-sm text-body text-surface-500">
                {searchQuery || activeCategory !== "all"
                  ? "Versuche einen anderen Suchbegriff oder waehle eine andere Kategorie aus."
                  : "Teile dein Wissen mit der Community und erhalte 50 XP als Belohnung."}
              </p>
              <Link href="/best-practices/new">
                <Button size="lg" iconLeft={<Plus />}>
                  Best Practice erstellen
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Grid */}
              <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                {practices.map((bp) => (
                  <BestPracticeCard key={bp.id} data={bp} />
                ))}
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!meta.hasPreviousPage}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Zurueck
                  </Button>
                  <span className="text-body-sm text-surface-500">
                    Seite {meta.page} von {meta.totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!meta.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Weiter
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
