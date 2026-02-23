// =============================================================================
// RecommendationSection Component
// Personalized recommendation cards for the dashboard
// =============================================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Lightbulb,
  MessageSquare,
  Trophy,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Recommendation, RecommendationType } from "@/types/recommendations";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface RecommendationSectionProps {
  className?: string;
}

// -----------------------------------------------------------------------------
// Type Configuration (icon, colors per recommendation type)
// -----------------------------------------------------------------------------

interface TypeConfig {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  labelClasses: string;
}

function getTypeConfig(type: RecommendationType): TypeConfig {
  switch (type) {
    case "continue_course":
      return {
        icon: <BookOpen className="h-4.5 w-4.5 text-blue-500" />,
        iconBg: "bg-blue-50",
        label: "Kurs fortsetzen",
        labelClasses: "bg-blue-50 text-blue-600",
      };
    case "new_course":
      return {
        icon: <GraduationCap className="h-4.5 w-4.5 text-lr-green-600" />,
        iconBg: "bg-lr-green-50",
        label: "Neuer Kurs",
        labelClasses: "bg-lr-green-50 text-lr-green-600",
      };
    case "best_practice":
      return {
        icon: <Lightbulb className="h-4.5 w-4.5 text-amber-500" />,
        iconBg: "bg-orange-50",
        label: "Best Practice",
        labelClasses: "bg-orange-50 text-amber-600",
      };
    case "community_post":
      return {
        icon: <MessageSquare className="h-4.5 w-4.5 text-purple-500" />,
        iconBg: "bg-purple-50",
        label: "Community",
        labelClasses: "bg-purple-50 text-purple-600",
      };
    case "challenge":
      return {
        icon: <Trophy className="h-4.5 w-4.5 text-lr-gold-500" />,
        iconBg: "bg-orange-50",
        label: "Challenge",
        labelClasses: "bg-orange-50 text-amber-500",
      };
  }
}

// -----------------------------------------------------------------------------
// Skeleton Loader
// -----------------------------------------------------------------------------

function RecommendationSkeleton() {
  return (
    <div className="rounded-[14px] border border-surface-200 bg-white p-5 shadow-card">
      <div className="animate-pulse">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-surface-200" />
          <div className="flex-1">
            <div className="h-3 w-16 rounded bg-surface-200" />
          </div>
        </div>
        <div className="mb-2 h-4 w-3/4 rounded bg-surface-200" />
        <div className="mb-3 h-3 w-full rounded bg-surface-200" />
        <div className="h-3 w-1/2 rounded bg-surface-200" />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Empty State
// -----------------------------------------------------------------------------

function EmptyState() {
  return (
    <div
      className={cn(
        "col-span-full flex flex-col items-center justify-center",
        "rounded-[14px] border border-dashed border-surface-300 bg-white/50 p-10",
      )}
    >
      <Sparkles
        className="mb-3 h-8 w-8 text-surface-300"
        aria-hidden="true"
      />
      <p className="text-body font-semibold text-surface-500">
        Keine Empfehlungen vorhanden
      </p>
      <p className="mt-1 text-body-sm text-surface-400">
        Sobald du aktiv wirst, erscheinen hier personalisierte Vorschlaege.
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Single Recommendation Card
// -----------------------------------------------------------------------------

function RecommendationCard({
  recommendation,
  index,
  mounted,
}: {
  recommendation: Recommendation;
  index: number;
  mounted: boolean;
}) {
  const config = getTypeConfig(recommendation.type);
  const hasProgress =
    recommendation.type === "continue_course" &&
    recommendation.metadata?.progress != null;

  return (
    <Link
      href={recommendation.href}
      className={cn(
        // Base card
        "group relative flex flex-col rounded-[14px] border border-surface-200 bg-white p-5",
        "shadow-card",
        "transition-all duration-300 ease-out",
        // Hover
        "hover:-translate-y-0.5 hover:border-surface-300 hover:shadow-card-hover",
        // Fade-in animation
        "translate-y-2 opacity-0",
        mounted && "translate-y-0 opacity-100",
      )}
      style={{
        transitionDelay: mounted ? `${index * 75}ms` : "0ms",
      }}
    >
      {/* Header: Icon + Label */}
      <div className="mb-3 flex items-center justify-between">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            config.iconBg,
          )}
          aria-hidden="true"
        >
          {config.icon}
        </div>

        <span
          className={cn(
            "rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            config.labelClasses,
          )}
        >
          {config.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="line-clamp-2 text-body font-semibold leading-snug text-surface-900 group-hover:text-lr-green-600">
        {recommendation.title}
      </h4>

      {/* Description */}
      <p className="mt-1.5 line-clamp-2 flex-1 text-body-sm leading-relaxed text-surface-500">
        {recommendation.description}
      </p>

      {/* Progress Bar (for courses) */}
      {hasProgress && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[10px] font-medium text-surface-400">
            <span>Fortschritt</span>
            <span className="text-lr-green-500">
              {recommendation.metadata?.progress}%
            </span>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-surface-200"
            role="progressbar"
            aria-valuenow={recommendation.metadata?.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Kursfortschritt: ${recommendation.metadata?.progress}%`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-lr-green-500 to-lr-gold-500 transition-all duration-700"
              style={{ width: `${recommendation.metadata?.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Reason */}
      <div className="mt-3 flex items-center gap-1.5 border-t border-surface-100 pt-3">
        <Sparkles
          className="h-3 w-3 shrink-0 text-lr-gold-500"
          aria-hidden="true"
        />
        <span className="line-clamp-1 text-[11px] font-medium text-surface-400">
          {recommendation.reason}
        </span>
      </div>

      {/* Hover arrow indicator */}
      <ArrowRight
        className={cn(
          "absolute bottom-5 right-5 h-4 w-4 text-surface-300",
          "transition-all duration-200",
          "opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-lr-green-500",
        )}
        aria-hidden="true"
      />
    </Link>
  );
}

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export function RecommendationSection({ className }: RecommendationSectionProps) {
  const [mounted, setMounted] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    async function fetchRecommendations() {
      try {
        const res = await fetch("/api/recommendations?limit=6");
        const json = await res.json();

        if (!res.ok || json.error) {
          setError(json.error?.message ?? "Empfehlungen konnten nicht geladen werden");
          return;
        }

        setRecommendations(json.data ?? []);
      } catch {
        setError("Empfehlungen konnten nicht geladen werden");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  // Don't render anything on error (silent failure for non-critical widget)
  if (error && !isLoading) {
    return null;
  }

  return (
    <section className={cn("flex flex-col", className)}>
      {/* Section Title */}
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-surface-900">
        <span
          className="h-4 w-[3px] rounded-full bg-lr-green-500"
          aria-hidden="true"
        />
        Fuer dich empfohlen
      </h2>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <>
            <RecommendationSkeleton />
            <RecommendationSkeleton />
            <RecommendationSkeleton />
            <div className="hidden sm:block">
              <RecommendationSkeleton />
            </div>
            <div className="hidden xl:block">
              <RecommendationSkeleton />
            </div>
            <div className="hidden xl:block">
              <RecommendationSkeleton />
            </div>
          </>
        ) : recommendations.length === 0 ? (
          <EmptyState />
        ) : (
          recommendations.map((rec, index) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              index={index}
              mounted={mounted}
            />
          ))
        )}
      </div>
    </section>
  );
}
