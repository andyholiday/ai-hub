// =============================================================================
// Topic Detail Card
// Displays detailed information about a selected radar item
// =============================================================================

"use client";

import { Card, CardHeader, CardBody, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  X,
  ExternalLink,
  ThumbsUp,
  Calendar,
  ArrowRight,
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

interface TopicDetailCardProps {
  item: RadarItem;
  maxVotes: number;
  url?: string | null;
  createdAt?: string;
  onClose: () => void;
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

const RING_DESCRIPTIONS: Record<RadarRing, string> = {
  adopt:
    "Diese Technologie empfehlen wir uneingeschraenkt. Erprobt und bewaehrt in der Praxis.",
  trial:
    "Vielversprechend und bereit fuer gezielte Pilotprojekte. Aktiv testen!",
  assess:
    "Interessant und wert, genauer betrachtet zu werden. Beobachten und evaluieren.",
  hold:
    "Derzeit nicht empfohlen fuer neue Projekte. Bestehende Nutzung beibehalten.",
};

const CATEGORY_ACCENT: Record<RadarCategory, "green" | "blue" | "gold" | "purple"> = {
  techniques: "green",
  tools: "blue",
  platforms: "gold",
  frameworks: "purple",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TopicDetailCard({
  item,
  maxVotes,
  url,
  createdAt,
  onClose,
}: TopicDetailCardProps) {
  const votePercentage = maxVotes > 0 ? (item.votes_count / maxVotes) * 100 : 0;

  return (
    <Card
      accent={CATEGORY_ACCENT[item.category]}
      className="animate-fade-in"
    >
      {/* Header */}
      <CardHeader
        title={item.title}
        subtitle={CATEGORY_LABELS[item.category]}
        action={
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        }
      />

      <CardBody>
        {/* Ring & Status */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={RING_BADGE_VARIANTS[item.ring]} size="md" dot>
            {RING_LABELS[item.ring]}
          </Badge>
          {item.isVotedByUser && (
            <Badge variant="green" size="sm">
              <ThumbsUp className="mr-0.5 h-3 w-3" />
              Deine Stimme
            </Badge>
          )}
        </div>

        {/* Description */}
        <p className="mt-4 text-body text-surface-700">{item.description}</p>

        {/* Ring explanation */}
        <div className="mt-4 rounded-lg bg-surface-50 p-3">
          <p className="text-body-sm font-medium text-surface-600">
            Was bedeutet &quot;{RING_LABELS[item.ring]}&quot;?
          </p>
          <p className="mt-1 text-caption text-surface-500">
            {RING_DESCRIPTIONS[item.ring]}
          </p>
        </div>

        {/* Vote Score */}
        <div className="mt-4">
          <ProgressBar
            value={votePercentage}
            max={100}
            label="Community-Bewertung"
            size="md"
            variant={
              item.ring === "adopt"
                ? "green"
                : item.ring === "trial"
                  ? "blue"
                  : item.ring === "assess"
                    ? "gold"
                    : "gradient"
            }
          />
          <p className="mt-1 text-caption text-surface-400">
            {item.votes_count} {item.votes_count === 1 ? "Stimme" : "Stimmen"}{" "}
            von der Community
          </p>
        </div>

        {/* Meta info */}
        {createdAt && (
          <div className="mt-4 flex items-center gap-1.5 text-caption text-surface-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Hinzugefuegt am{" "}
              {new Date(createdAt).toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </CardBody>

      {/* Footer with link */}
      {url && (
        <CardFooter>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-body-sm font-medium text-lr-green-600 transition-colors hover:text-lr-green-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Mehr erfahren
          </a>
        </CardFooter>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Empty state when no item is selected
// ---------------------------------------------------------------------------

export function TopicDetailEmpty() {
  return (
    <Card className="flex flex-col items-center justify-center py-10 text-center">
      <div className="rounded-2xl bg-surface-100 p-4">
        <ArrowRight className="h-8 w-8 text-surface-400" />
      </div>
      <p className="mt-4 text-title-sm font-semibold text-surface-700">
        Topic auswaehlen
      </p>
      <p className="mt-1 max-w-[240px] text-body-sm text-surface-500">
        Klicke auf einen Punkt im Radar oder waehle ein Topic aus der Liste.
      </p>
    </Card>
  );
}
