"use client";

// =============================================================================
// LearningPathCard Component
// Card for displaying a learning path in the overview grid.
// Shows title, description, difficulty, estimated hours, course count,
// and user progress.
// =============================================================================

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LearningPathProgress } from "./LearningPathProgress";
import {
  BookOpen,
  Clock,
  Route,
  Sparkles,
  Map,
  Compass,
  CheckCircle2,
} from "lucide-react";
import type { DifficultyLevel } from "@/lib/validators/learn-hub";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from "@/constants/learn-hub";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LearningPathCardData {
  id: string;
  title: string;
  description: string;
  slug: string;
  difficulty: DifficultyLevel;
  estimated_hours: number;
  icon: string;
  color: string;
  totalCourses: number;
  completedCourses: number;
  overallProgress: number;
  isEnrolled: boolean;
  isCompleted: boolean;
  isStarted: boolean;
}

interface LearningPathCardProps {
  path: LearningPathCardData;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, typeof Route> = {
  Route,
  Sparkles,
  Map,
  Compass,
};

interface ColorScheme {
  bg: string;
  icon: string;
  gradient: string;
}

const DEFAULT_COLOR: ColorScheme = {
  bg: "bg-lr-green-50",
  icon: "text-lr-green-600",
  gradient: "from-lr-green-500 to-lr-green-600",
};

const COLOR_MAP: Record<string, ColorScheme> = {
  green: DEFAULT_COLOR,
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    gradient: "from-blue-500 to-blue-600",
  },
  gold: {
    bg: "bg-lr-gold-50",
    icon: "text-lr-gold-600",
    gradient: "from-lr-gold-500 to-lr-gold-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "text-purple-600",
    gradient: "from-purple-500 to-purple-600",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LearningPathCard({ path }: LearningPathCardProps) {
  const IconComponent = ICON_MAP[path.icon] ?? Route;
  const colorScheme: ColorScheme = COLOR_MAP[path.color] ?? DEFAULT_COLOR;

  return (
    <Card hoverable noPadding>
      <Link href={`/learn-hub/paths/${path.id}`} className="block">
        {/* Color Header */}
        <div
          className={`relative flex items-center gap-4 rounded-t-[14px] bg-gradient-to-r p-5 ${colorScheme.gradient}`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-title-sm font-semibold text-white line-clamp-1">
              {path.title}
            </h3>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge
                variant={DIFFICULTY_COLORS[path.difficulty]}
                size="sm"
              >
                {DIFFICULTY_LABELS[path.difficulty]}
              </Badge>
            </div>
          </div>

          {/* Completed Badge */}
          {path.isCompleted && (
            <div className="absolute right-3 top-3">
              <div className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                <span className="text-overline font-medium text-white">
                  Abgeschlossen
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Description */}
          <p className="text-body-sm text-surface-500 line-clamp-2">
            {path.description}
          </p>

          {/* Meta */}
          <div className="mt-3 flex items-center gap-4 text-caption text-surface-400">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span>
                {path.totalCourses}{" "}
                {path.totalCourses === 1 ? "Kurs" : "Kurse"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>~{path.estimated_hours} Std.</span>
            </div>
          </div>

          {/* Progress */}
          {path.isEnrolled && !path.isCompleted && (
            <div className="mt-3">
              <LearningPathProgress
                completedCourses={path.completedCourses}
                totalCourses={path.totalCourses}
                overallProgress={path.overallProgress}
                size="sm"
              />
            </div>
          )}

          {/* Action */}
          <div className="mt-4">
            <Button
              variant={
                path.isCompleted
                  ? "secondary"
                  : path.isEnrolled
                    ? "outline"
                    : "primary"
              }
              size="sm"
              fullWidth
            >
              {path.isCompleted
                ? "Erneut ansehen"
                : path.isEnrolled
                  ? "Fortsetzen"
                  : "Lernpfad ansehen"}
            </Button>
          </div>
        </div>
      </Link>
    </Card>
  );
}
