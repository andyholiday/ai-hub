"use client";

// =============================================================================
// Idea Card Component
// Displays a single idea post in a visually distinct card format with
// gradient accent, upvote count, author info, and engagement metrics.
// =============================================================================

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Lightbulb, ThumbsUp, MessageSquare } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IdeaPost {
  id: string;
  title: string;
  content: string;
  tags: string[];
  upvotes_count: number;
  comments_count: number;
  views_count: number;
  is_pinned: boolean;
  created_at: string;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    level: number;
  };
  hasUpvoted: boolean;
}

export interface IdeaCardProps {
  idea: IdeaPost;
  onVote: (postId: string) => void;
  isVoting: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `vor ${hours} Std.`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `vor ${days} ${days === 1 ? "Tag" : "Tagen"}`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `vor ${weeks} ${weeks === 1 ? "Woche" : "Wochen"}`;

  const months = Math.floor(days / 30);
  return `vor ${months} ${months === 1 ? "Monat" : "Monaten"}`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function IdeaCard({ idea, onVote, isVoting, className }: IdeaCardProps) {
  const timeAgo = getTimeAgo(idea.created_at);

  return (
    <Card
      hoverable
      accent="gold"
      className={cn("flex flex-col p-0", className)}
    >
      <Link
        href={`/community/${idea.id}`}
        className="flex flex-1 flex-col p-5"
      >
        {/* Header: Icon + Upvotes */}
        <div className="flex items-start justify-between gap-3">
          {/* Idea Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent-50">
            <Lightbulb className="h-5 w-5 text-brand-accent-600" />
          </div>

          {/* Upvote Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onVote(idea.id);
            }}
            disabled={isVoting}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 transition-colors",
              idea.hasUpvoted
                ? "bg-brand-primary-50 text-brand-primary-600"
                : "bg-surface-100 text-surface-400 hover:bg-surface-200 hover:text-surface-600",
            )}
            aria-label="Upvote"
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-caption font-bold tabular-nums">
              {idea.upvotes_count}
            </span>
          </button>
        </div>

        {/* Title */}
        <h3 className="mt-3 font-heading text-title-sm font-semibold text-surface-900 line-clamp-2">
          {idea.title}
        </h3>

        {/* Description (truncated) */}
        <p className="mt-2 flex-1 text-body-sm text-surface-500 line-clamp-3">
          {truncateText(idea.content, 150)}
        </p>

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {idea.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="gray" size="sm">
                {tag}
              </Badge>
            ))}
            {idea.tags.length > 3 && (
              <Badge variant="gray" size="sm">
                +{idea.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer: Author + Meta */}
        <div className="mt-4 flex items-center justify-between border-t border-surface-200 pt-3">
          {/* Author */}
          <div className="flex items-center gap-1.5">
            <Avatar
              name={idea.author.full_name ?? ""}
              src={idea.author.avatar_url}
              size="xs"
            />
            <span className="text-caption text-surface-500 truncate max-w-[100px]">
              {idea.author.full_name ?? "Anonym"}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-caption text-surface-400">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{idea.comments_count}</span>
            </div>
            <span>{timeAgo}</span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
