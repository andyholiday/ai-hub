"use client";

// =============================================================================
// Idea Board Component
// Responsive grid container that renders IdeaCards with loading, empty,
// and error states. Handles data fetching and vote toggling.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Lightbulb, Loader2 } from "lucide-react";
import { IdeaCard } from "./idea-card";
import { IdeaFilters } from "./idea-filters";
import type { IdeaPost } from "./idea-card";
import type { IdeaSortOption } from "./idea-filters";

// ---------------------------------------------------------------------------
// API Sort Mapping
// ---------------------------------------------------------------------------

/** Maps client-side sort options to API query parameters */
function getApiSortParam(sort: IdeaSortOption): string {
  switch (sort) {
    case "most_upvoted":
      return "most_upvoted";
    case "newest":
      return "newest";
    case "most_commented":
      // The API supports "most_upvoted", "newest", "most_viewed".
      // For "most_commented" we fetch newest and sort client-side.
      return "newest";
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export interface IdeaBoardProps {
  onRequestCreate?: () => void;
}

export function IdeaBoard({ onRequestCreate }: IdeaBoardProps = {}) {
  const [ideas, setIdeas] = useState<IdeaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<IdeaSortOption>("most_upvoted");
  const [votingPostId, setVotingPostId] = useState<string | null>(null);

  // --- Fetch Ideas ---
  const fetchIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("type", "idea");
      params.set("sort", getApiSortParam(sort));
      params.set("pageSize", "50");
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/community/posts?${params.toString()}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      let fetchedIdeas: IdeaPost[] = json.data ?? [];

      // Client-side sort for "most_commented"
      if (sort === "most_commented") {
        fetchedIdeas = [...fetchedIdeas].sort(
          (a, b) => b.comments_count - a.comments_count,
        );
      }

      setIdeas(fetchedIdeas);
    } catch {
      setError("Ideen konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }, [sort, search]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // --- Toggle Vote ---
  const handleVote = async (postId: string) => {
    setVotingPostId(postId);
    try {
      const res = await fetch(`/api/community/posts/${postId}/vote`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.data) {
        setIdeas((prev) =>
          prev.map((idea) =>
            idea.id === postId
              ? {
                ...idea,
                hasUpvoted: json.data.voted,
                upvotes_count:
                  idea.upvotes_count + (json.data.voted ? 1 : -1),
              }
              : idea,
          ),
        );
      }
    } finally {
      setVotingPostId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <IdeaFilters
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
      />

      {/* Error */}
      {error && (
        <Card className="border-error bg-error-light p-4">
          <p className="text-body-sm text-error-dark">{error}</p>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-accent-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && ideas.length === 0 && (
        <Card className="py-16 text-center border-dashed border-2 bg-surface-50/50">
          <div className="mx-auto bg-brand-accent-100 flex items-center justify-center h-16 w-16 rounded-full mb-4 shadow-sm">
            <Lightbulb className="h-8 w-8 text-brand-accent-600" />
          </div>
          <p className="text-title-md font-semibold text-surface-900">
            Noch keine Ideen vorhanden
          </p>
          <p className="mt-2 text-body text-surface-500 max-w-sm mx-auto mb-6">
            Teile deine Vision oder Use Cases! Gute Ideen werden von der Community bewertet und direkt vom AI Mentor auf ihren echten Mehrwert analysiert.
          </p>
          {onRequestCreate && (
            <button
              onClick={onRequestCreate}
              className="inline-flex items-center justify-center rounded-xl bg-brand-primary-500 px-6 py-2.5 text-body-sm font-medium text-white shadow-soft transition-all hover:bg-brand-primary-600 focus:outline-none focus:ring-2 focus:ring-brand-primary-500/20 active:scale-95"
            >
              Erste Idee einreichen
            </button>
          )}
        </Card>
      )}

      {/* Idea Grid: 1 col mobile, 2 cols tablet, 3 cols desktop */}
      {!isLoading && ideas.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onVote={handleVote}
              isVoting={votingPostId === idea.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
