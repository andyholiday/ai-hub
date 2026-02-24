// =============================================================================
// BestPracticeCard Component
// Card for the Best Practices overview grid
// =============================================================================

"use client";

import Link from "next/link";
import {
  ThumbsUp,
  MessageSquare,
  Eye,
  Star,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type BestPracticeCategory =
  | "prompt-engineering"
  | "ki-tools"
  | "automatisierung"
  | "datenanalyse"
  | "ki-ethik";

export interface BestPracticeCardData {
  id: string;
  title: string;
  excerpt: string;
  category: BestPracticeCategory;
  author: {
    name: string;
    avatarUrl?: string | null;
    department: string;
  };
  createdAt: string;
  tags: string[];
  upvotes: number;
  comments: number;
  views: number;
  xpReward: number;
  isFeatured?: boolean;
}

export interface BestPracticeCardProps {
  data: BestPracticeCardData;
  className?: string;
}

// -----------------------------------------------------------------------------
// Category Configuration
// -----------------------------------------------------------------------------

export const categoryConfig: Record<
  BestPracticeCategory,
  { label: string; variant: "green" | "blue" | "purple" | "gold" | "red" }
> = {
  "prompt-engineering": { label: "Prompt Engineering", variant: "green" },
  "ki-tools": { label: "KI-Tools", variant: "blue" },
  automatisierung: { label: "Automatisierung", variant: "purple" },
  datenanalyse: { label: "Datenanalyse", variant: "gold" },
  "ki-ethik": { label: "KI-Ethik", variant: "red" },
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function BestPracticeCard({ data, className }: BestPracticeCardProps) {
  const catConfig = categoryConfig[data.category];

  return (
    <Link
      href={`/best-practices/${data.id}`}
      className={cn(
        // Base card styles matching project design
        "group relative flex flex-col rounded-[14px] border border-surface-200 bg-white",
        "shadow-card",
        "transition-all duration-300 ease-out",
        // Hover effect
        "hover:-translate-y-0.5 hover:shadow-card-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500 focus-visible:ring-offset-2",
        className
      )}
    >
      {/* Featured Star Badge */}
      {data.isFeatured && (
        <div
          className="absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent-500 shadow-brand-accent"
          aria-label="Hervorgehobene Best Practice"
        >
          <Star className="h-4 w-4 fill-white text-white" />
        </div>
      )}

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Category Badge */}
        <div className="mb-3">
          <Badge variant={catConfig.variant} size="sm" dot>
            {catConfig.label}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="font-heading text-[16px] font-semibold leading-snug text-surface-900 group-hover:text-brand-primary-600 transition-colors duration-200">
          {data.title}
        </h3>

        {/* Excerpt (truncated to 2-3 lines) */}
        <p className="mt-2 line-clamp-3 text-body-sm leading-relaxed text-surface-500">
          {data.excerpt}
        </p>

        {/* Author Section */}
        <div className="mt-4 flex items-center gap-3">
          <Avatar
            name={data.author.name}
            src={data.author.avatarUrl}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-body-sm font-medium text-surface-800">
              {data.author.name}
            </p>
            <p className="truncate text-caption text-surface-400">
              {data.author.department} &middot; {data.createdAt}
            </p>
          </div>
        </div>

        {/* Tags */}
        {data.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-md bg-surface-100 px-2 py-0.5 text-overline font-medium text-surface-500"
              >
                {tag}
              </span>
            ))}
            {data.tags.length > 3 && (
              <span className="inline-block rounded-md bg-surface-100 px-2 py-0.5 text-overline font-medium text-surface-400">
                +{data.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer with Stats */}
      <div className="flex items-center gap-4 border-t border-surface-200 px-5 py-3">
        {/* Upvotes */}
        <div className="flex items-center gap-1.5 text-surface-500">
          <ThumbsUp className="h-3.5 w-3.5" />
          <span className="text-caption font-medium">{data.upvotes}</span>
        </div>

        {/* Comments */}
        <div className="flex items-center gap-1.5 text-surface-500">
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="text-caption font-medium">{data.comments}</span>
        </div>

        {/* Views */}
        <div className="flex items-center gap-1.5 text-surface-500">
          <Eye className="h-3.5 w-3.5" />
          <span className="text-caption font-medium">{data.views}</span>
        </div>

        {/* XP Reward (right-aligned) */}
        <div className="ml-auto flex items-center gap-1 text-brand-primary-600">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-caption font-semibold">+{data.xpReward} XP</span>
        </div>
      </div>
    </Link>
  );
}
