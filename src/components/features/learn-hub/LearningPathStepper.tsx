"use client";

// =============================================================================
// LearningPathStepper Component
// Vertical timeline/stepper showing course sequence within a learning path.
// Each step shows course info, completion status, and progress.
// =============================================================================

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  Lock,
  BookOpen,
  Clock,
  Star,
} from "lucide-react";
import type { DifficultyLevel } from "@/lib/validators/learn-hub";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from "@/constants/learn-hub";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StepperCourse {
  id: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  duration_minutes: number;
  lessons_count: number;
  xp_reward: number;
  order_index: number;
  is_required: boolean;
  progressPercentage: number;
  isCompleted: boolean;
  isStarted: boolean;
  completedLessons: number;
}

interface LearningPathStepperProps {
  courses: StepperCourse[];
  nextCourseIndex: number | null;
  isEnrolled: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LearningPathStepper({
  courses,
  nextCourseIndex,
  isEnrolled,
}: LearningPathStepperProps) {
  return (
    <div className="relative">
      {courses.map((course, index) => {
        const isLast = index === courses.length - 1;
        const isNext = index === nextCourseIndex;
        const isLocked = !isEnrolled && index > 0;

        return (
          <div key={course.id} className="relative flex gap-4">
            {/* Timeline Line + Icon */}
            <div className="flex flex-col items-center">
              {/* Status Icon */}
              <div className="relative z-10 shrink-0">
                {course.isCompleted ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary-100">
                    <CheckCircle2 className="h-6 w-6 text-brand-primary-500" />
                  </div>
                ) : isNext && isEnrolled ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary-500 shadow-lg shadow-brand-primary-500/30">
                    <PlayCircle className="h-6 w-6 text-white" />
                  </div>
                ) : isLocked ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100">
                    <Lock className="h-5 w-5 text-surface-300" />
                  </div>
                ) : course.isStarted ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <PlayCircle className="h-6 w-6 text-blue-500" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-100">
                    <Circle className="h-6 w-6 text-surface-300" />
                  </div>
                )}
              </div>

              {/* Connecting Line */}
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 ${
                    course.isCompleted
                      ? "bg-brand-primary-300"
                      : "bg-surface-200"
                  }`}
                />
              )}
            </div>

            {/* Course Content */}
            <div
              className={`mb-6 min-w-0 flex-1 rounded-xl border p-4 transition-all ${
                isNext && isEnrolled
                  ? "border-brand-primary-300 bg-brand-primary-50/50 shadow-sm"
                  : course.isCompleted
                    ? "border-brand-primary-200 bg-brand-primary-50/30"
                    : "border-surface-200 bg-white"
              }`}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {/* Step Number + Title */}
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-semibold text-surface-400">
                      Schritt {index + 1}
                    </span>
                    {isNext && isEnrolled && (
                      <Badge variant="green" size="sm">
                        Empfohlen
                      </Badge>
                    )}
                    {!course.is_required && (
                      <Badge variant="gray" size="sm">
                        Optional
                      </Badge>
                    )}
                  </div>

                  <h4 className="mt-1 font-heading text-body font-semibold text-surface-900">
                    {course.title}
                  </h4>
                </div>

                {/* Status Badge */}
                <div className="shrink-0">
                  {course.isCompleted ? (
                    <Badge variant="green" size="sm">
                      Fertig
                    </Badge>
                  ) : course.isStarted ? (
                    <Badge variant="blue" size="sm">
                      In Bearbeitung
                    </Badge>
                  ) : null}
                </div>
              </div>

              {/* Description */}
              <p className="mt-1.5 text-body-sm text-surface-500 line-clamp-2">
                {course.description}
              </p>

              {/* Meta */}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-caption text-surface-400">
                <Badge
                  variant={DIFFICULTY_COLORS[course.difficulty]}
                  size="sm"
                >
                  {DIFFICULTY_LABELS[course.difficulty]}
                </Badge>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>
                    {course.lessons_count}{" "}
                    {course.lessons_count === 1 ? "Lektion" : "Lektionen"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDuration(course.duration_minutes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5" />
                  <span>{course.xp_reward} XP</span>
                </div>
              </div>

              {/* Progress Bar (if started but not completed) */}
              {course.isStarted && !course.isCompleted && (
                <div className="mt-3">
                  <ProgressBar
                    value={course.progressPercentage}
                    size="sm"
                    variant="gradient"
                    label={`${course.completedLessons} von ${course.lessons_count} Lektionen`}
                  />
                </div>
              )}

              {/* Action Link */}
              {isEnrolled && !isLocked && (
                <div className="mt-3">
                  <Link
                    href={`/learn-hub/${course.id}`}
                    className={`inline-flex items-center gap-1.5 text-body-sm font-medium transition-colors ${
                      isNext
                        ? "text-brand-primary-600 hover:text-brand-primary-700"
                        : "text-surface-500 hover:text-surface-700"
                    }`}
                  >
                    {course.isCompleted
                      ? "Erneut ansehen"
                      : course.isStarted
                        ? "Fortsetzen"
                        : "Kurs starten"}
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} Std.`;
  return `${hours} Std. ${remaining} Min.`;
}
