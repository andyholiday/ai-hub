"use client";

// =============================================================================
// Evaluation Card Component
// Displays the AI evaluation result for a use-case idea with score bars,
// recommendation badge, strengths, risks, and next steps.
// =============================================================================

import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import {
  Brain,
  TrendingUp,
  Wrench,
  Lightbulb,
  Cpu,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  UseCaseEvaluation,
  Recommendation,
} from "@/lib/validators/evaluation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EvaluationCardProps {
  evaluation: UseCaseEvaluation;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RECOMMENDATION_CONFIG: Record<
  Recommendation,
  { label: string; variant: BadgeVariant; description: string }
> = {
  highly_recommended: {
    label: "Sehr empfohlen",
    variant: "green",
    description: "Dieser Use-Case hat hervorragendes Potenzial",
  },
  recommended: {
    label: "Empfohlen",
    variant: "blue",
    description: "Dieser Use-Case ist vielversprechend",
  },
  consider: {
    label: "Pruefen",
    variant: "gold",
    description: "Dieser Use-Case sollte naeher geprueft werden",
  },
  not_recommended: {
    label: "Nicht empfohlen",
    variant: "red",
    description: "Dieser Use-Case birgt zu viele Risiken",
  },
};

interface ScoreDimension {
  key: string;
  label: string;
  icon: ReactNode;
}

const SCORE_DIMENSIONS: ScoreDimension[] = [
  { key: "impact", label: "Business Impact", icon: <TrendingUp className="h-4 w-4" /> },
  { key: "feasibility", label: "Machbarkeit", icon: <Wrench className="h-4 w-4" /> },
  { key: "aiReadiness", label: "KI-Eignung", icon: <Cpu className="h-4 w-4" /> },
  { key: "innovation", label: "Innovation", icon: <Lightbulb className="h-4 w-4" /> },
  { key: "effort", label: "Aufwand (gering)", icon: <Brain className="h-4 w-4" /> },
];

// ---------------------------------------------------------------------------
// Score Color Helper
// ---------------------------------------------------------------------------

function getScoreColor(score: number): string {
  if (score >= 75) return "bg-brand-primary-500";
  if (score >= 55) return "bg-info";
  if (score >= 35) return "bg-brand-accent-500";
  return "bg-error";
}

function getScoreTextColor(score: number): string {
  if (score >= 75) return "text-brand-primary-700";
  if (score >= 55) return "text-info-dark";
  if (score >= 35) return "text-brand-accent-800";
  return "text-error-dark";
}

function getOverallScoreRingColor(score: number): string {
  if (score >= 75) return "ring-brand-primary-500";
  if (score >= 55) return "ring-info";
  if (score >= 35) return "ring-brand-accent-500";
  return "ring-error";
}

function getOverallScoreBgColor(score: number): string {
  if (score >= 75) return "bg-brand-primary-50";
  if (score >= 55) return "bg-info-light";
  if (score >= 35) return "bg-brand-accent-50";
  return "bg-error-light";
}

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-body-sm text-surface-600">
          <span className="text-surface-400">{icon}</span>
          <span>{label}</span>
        </div>
        <span
          className={cn(
            "text-body-sm font-bold tabular-nums",
            getScoreTextColor(score),
          )}
        >
          {score}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-200">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            getScoreColor(score),
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function ListSection({
  title,
  items,
  icon,
  iconClassName,
}: {
  title: string;
  items: string[];
  icon: ReactNode;
  iconClassName: string;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h4 className="mb-2.5 flex items-center gap-2 text-body-sm font-semibold text-surface-800">
        <span className={iconClassName}>{icon}</span>
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-2 text-body-sm text-surface-600"
          >
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-surface-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EvaluationCard({ evaluation, className }: EvaluationCardProps) {
  const { scores, overallScore, recommendation, evaluationText, strengths, risks, nextSteps } =
    evaluation;

  const recConfig = RECOMMENDATION_CONFIG[recommendation];

  return (
    <Card accent="green" className={cn("space-y-6", className)}>
      {/* Header: Overall Score + Recommendation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Overall Score Circle */}
          <div
            className={cn(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-full ring-4",
              getOverallScoreBgColor(overallScore),
              getOverallScoreRingColor(overallScore),
            )}
          >
            <span
              className={cn(
                "text-xl font-bold tabular-nums",
                getScoreTextColor(overallScore),
              )}
            >
              {overallScore}
            </span>
          </div>

          <div>
            <h3 className="font-heading text-title-sm font-semibold text-surface-900">
              KI-Bewertung
            </h3>
            <p className="mt-0.5 text-body-sm text-surface-500">
              {recConfig.description}
            </p>
          </div>
        </div>

        <Badge variant={recConfig.variant} size="md" dot>
          {recConfig.label}
        </Badge>
      </div>

      {/* Score Bars */}
      <div className="space-y-3">
        {SCORE_DIMENSIONS.map((dim) => (
          <ScoreBar
            key={dim.key}
            label={dim.label}
            score={scores[dim.key as keyof typeof scores]}
            icon={dim.icon}
          />
        ))}
      </div>

      {/* Evaluation Text */}
      <div className="rounded-xl bg-surface-50 p-4">
        <p className="whitespace-pre-wrap text-body-sm leading-relaxed text-surface-700">
          {evaluationText}
        </p>
      </div>

      {/* Strengths / Risks / Next Steps Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <ListSection
          title="Staerken"
          items={strengths}
          icon={<CheckCircle className="h-4 w-4" />}
          iconClassName="text-brand-primary-500"
        />
        <ListSection
          title="Risiken"
          items={risks}
          icon={<AlertTriangle className="h-4 w-4" />}
          iconClassName="text-brand-accent-500"
        />
        <ListSection
          title="Naechste Schritte"
          items={nextSteps}
          icon={<ArrowRight className="h-4 w-4" />}
          iconClassName="text-info"
        />
      </div>
    </Card>
  );
}
