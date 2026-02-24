"use client";

// =============================================================================
// Learn Hub - Learning Path Detail Page
// Shows detailed view of a learning path with course sequence as a stepper,
// progress tracking, and enrollment actions.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LearningPathProgress } from "@/components/features/learn-hub/LearningPathProgress";
import {
  LearningPathStepper,
  type StepperCourse,
} from "@/components/features/learn-hub/LearningPathStepper";
import {
  ArrowLeft,
  Loader2,
  Route,
  Clock,
  BookOpen,
  Star,
  Sparkles,
  Map,
  Compass,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import type { DifficultyLevel } from "@/lib/validators/learn-hub";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from "@/constants/learn-hub";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LearningPathDetail {
  id: string;
  title: string;
  description: string;
  slug: string;
  difficulty: DifficultyLevel;
  estimated_hours: number;
  icon: string;
  color: string;
  courses: StepperCourse[];
  totalCourses: number;
  completedCourses: number;
  overallProgress: number;
  isEnrolled: boolean;
  isCompleted: boolean;
  isStarted: boolean;
  currentCourseIndex: number;
  nextCourseIndex: number | null;
  totalXP: number;
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
  bg: "bg-brand-primary-50",
  icon: "text-brand-primary-600",
  gradient: "from-brand-primary-500 to-brand-primary-600",
};

const COLOR_MAP: Record<string, ColorScheme> = {
  green: DEFAULT_COLOR,
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    gradient: "from-blue-500 to-blue-600",
  },
  gold: {
    bg: "bg-brand-accent-50",
    icon: "text-brand-accent-600",
    gradient: "from-brand-accent-500 to-brand-accent-600",
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

export default function LearningPathDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathId = params.pathId as string;

  const [path, setPath] = useState<LearningPathDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // --- Fetch Learning Path ---
  const fetchPath = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/learn-hub/paths/${pathId}`);
      const json = await res.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      setPath(json.data);
    } catch {
      setError("Lernpfad konnte nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }, [pathId]);

  useEffect(() => {
    fetchPath();
  }, [fetchPath]);

  // --- Enroll ---
  const handleEnroll = async () => {
    if (!path) return;
    setIsEnrolling(true);
    setError(null);

    try {
      const res = await fetch(`/api/learn-hub/paths/${pathId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enroll" }),
      });
      const json = await res.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      // Refresh path data
      await fetchPath();
    } catch {
      setError("Einschreibung fehlgeschlagen.");
    } finally {
      setIsEnrolling(false);
    }
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary-500" />
      </div>
    );
  }

  // --- Error ---
  if (error && !path) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<ArrowLeft />}
          onClick={() => router.push("/learn-hub/paths")}
        >
          Zurueck
        </Button>
        <Card className="border-error bg-error-light p-4">
          <p className="text-body-sm text-error-dark">
            {error ?? "Lernpfad nicht gefunden"}
          </p>
        </Card>
      </div>
    );
  }

  if (!path) return null;

  const IconComponent = ICON_MAP[path.icon] ?? Route;
  const colorScheme: ColorScheme = COLOR_MAP[path.color] ?? DEFAULT_COLOR;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button
        variant="ghost"
        size="sm"
        iconLeft={<ArrowLeft />}
        onClick={() => router.push("/learn-hub/paths")}
      >
        Zurueck zu Lernpfade
      </Button>

      {/* Path Header */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2">
          <Card noPadding>
            {/* Color Banner */}
            <div
              className={`flex items-center gap-4 rounded-t-[14px] bg-gradient-to-r p-6 ${colorScheme.gradient}`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                <IconComponent className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  {path.title}
                </h1>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant={DIFFICULTY_COLORS[path.difficulty]}
                    size="md"
                  >
                    {DIFFICULTY_LABELS[path.difficulty]}
                  </Badge>
                  {path.isCompleted && (
                    <div className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-sm">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                      <span className="text-caption font-medium text-white">
                        Abgeschlossen
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-6">
              <p className="text-body text-surface-700">{path.description}</p>

              {/* Meta */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-body-sm text-surface-500">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  <span>
                    {path.totalCourses}{" "}
                    {path.totalCourses === 1 ? "Kurs" : "Kurse"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>~{path.estimated_hours} Stunden</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4" />
                  <span>{path.totalXP} XP gesamt</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress & Actions Sidebar */}
        <div className="space-y-4">
          {/* Progress Card */}
          <Card>
            <h3 className="font-heading text-title-sm font-semibold text-surface-900">
              Dein Fortschritt
            </h3>

            <div className="mt-3">
              <LearningPathProgress
                completedCourses={path.completedCourses}
                totalCourses={path.totalCourses}
                overallProgress={path.overallProgress}
              />
            </div>

            <div className="mt-4 space-y-2">
              {/* Enroll Button */}
              {!path.isEnrolled && (
                <Button
                  fullWidth
                  iconLeft={<Route />}
                  isLoading={isEnrolling}
                  onClick={handleEnroll}
                >
                  Lernpfad starten
                </Button>
              )}

              {/* Continue Button */}
              {(() => {
                const nextCourse =
                  path.isEnrolled &&
                  !path.isCompleted &&
                  path.nextCourseIndex != null
                    ? path.courses[path.nextCourseIndex]
                    : undefined;
                return nextCourse ? (
                  <Link href={`/learn-hub/${nextCourse.id}`}>
                    <Button fullWidth iconLeft={<BookOpen />}>
                      Naechsten Kurs starten
                    </Button>
                  </Link>
                ) : null;
              })()}

              {/* Completed State */}
              {path.isCompleted && (
                <div className="rounded-lg bg-brand-primary-50 p-4 text-center">
                  <Trophy className="mx-auto h-8 w-8 text-brand-primary-600" />
                  <p className="mt-2 text-body-sm font-semibold text-brand-primary-700">
                    Lernpfad abgeschlossen!
                  </p>
                  <p className="mt-0.5 text-caption text-brand-primary-600">
                    Alle Kurse erfolgreich bearbeitet
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* XP Card */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-accent-50">
                <Star className="h-5 w-5 text-brand-accent-600" />
              </div>
              <div>
                <p className="text-caption text-surface-500">
                  Gesamte XP-Belohnung
                </p>
                <p className="text-title-sm font-bold text-surface-900">
                  {path.totalXP} XP
                </p>
              </div>
            </div>
            <p className="mt-2 text-caption text-surface-500">
              Verteilt auf {path.totalCourses} Kurse in diesem Lernpfad
            </p>
          </Card>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-error bg-error-light p-4">
          <p className="text-body-sm text-error-dark">{error}</p>
        </Card>
      )}

      {/* Course Stepper */}
      <Card>
        <h2 className="font-heading text-title font-semibold text-surface-900">
          Kurs-Reihenfolge
        </h2>
        <p className="mt-0.5 text-body-sm text-surface-500">
          {path.completedCourses} von {path.totalCourses} Kursen abgeschlossen
        </p>

        <div className="mt-6">
          <LearningPathStepper
            courses={path.courses}
            nextCourseIndex={path.nextCourseIndex}
            isEnrolled={path.isEnrolled}
          />
        </div>
      </Card>
    </div>
  );
}
