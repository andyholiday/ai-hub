"use client";

// =============================================================================
// Learn Hub - Course Detail Page
// Shows course info, lesson list with progress, and start/continue actions.
// =============================================================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  BookOpen,
  Clock,
  Star,
  Loader2,
  CheckCircle2,
  Circle,
  PlayCircle,
  ArrowLeft,
  Trophy,
  Award,
  FileText,
  Video,
  HelpCircle,
  Zap,
} from "lucide-react";
import type { DifficultyLevel } from "@/lib/validators/learn-hub";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
}

interface LessonWithProgress {
  id: string;
  title: string;
  lesson_type: "text" | "video" | "quiz" | "interactive";
  order_index: number;
  duration_minutes: number;
  isCompleted: boolean;
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  category: string;
  difficulty: DifficultyLevel;
  duration_minutes: number;
  lessons_count: number;
  xp_reward: number;
  author: CourseAuthor | null;
  created_at: string;
  lessons: LessonWithProgress[];
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  isCompleted: boolean;
  isStarted: boolean;
  certificateId: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: "Einsteiger",
  intermediate: "Fortgeschritten",
  advanced: "Experte",
};

const DIFFICULTY_COLORS: Record<DifficultyLevel, "green" | "gold" | "red"> = {
  beginner: "green",
  intermediate: "gold",
  advanced: "red",
};

const LESSON_TYPE_ICONS: Record<string, typeof FileText> = {
  text: FileText,
  video: Video,
  quiz: HelpCircle,
  interactive: Zap,
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  text: "Text",
  video: "Video",
  quiz: "Quiz",
  interactive: "Interaktiv",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  // --- Fetch Course ---
  useEffect(() => {
    async function fetchCourse() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/learn-hub/courses/${courseId}`);
        const json = await res.json();

        if (json.error) {
          setError(json.error.message);
          return;
        }

        setCourse(json.data);
      } catch {
        setError("Kurs konnte nicht geladen werden.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCourse();
  }, [courseId]);

  // --- Complete Course ---
  const handleCompleteCourse = async () => {
    if (!course) return;
    setIsCompleting(true);

    try {
      const res = await fetch(
        `/api/learn-hub/courses/${courseId}/complete`,
        { method: "POST" },
      );
      const json = await res.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      // Refresh course data
      const refreshRes = await fetch(`/api/learn-hub/courses/${courseId}`);
      const refreshJson = await refreshRes.json();
      if (refreshJson.data) {
        setCourse(refreshJson.data);
      }
    } catch {
      setError("Kurs konnte nicht abgeschlossen werden.");
    } finally {
      setIsCompleting(false);
    }
  };

  // --- Find next uncompleted lesson ---
  const getNextLesson = (): LessonWithProgress | null => {
    if (!course) return null;
    return course.lessons.find((l) => !l.isCompleted) ?? null;
  };

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-lr-green-500" />
      </div>
    );
  }

  // --- Error ---
  if (error || !course) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<ArrowLeft />}
          onClick={() => router.push("/learn-hub")}
        >
          Zurueck
        </Button>
        <Card className="border-error bg-error-light p-4">
          <p className="text-body-sm text-error-dark">
            {error ?? "Kurs nicht gefunden"}
          </p>
        </Card>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const allLessonsCompleted =
    course.completedLessons === course.totalLessons && course.totalLessons > 0;

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button
        variant="ghost"
        size="sm"
        iconLeft={<ArrowLeft />}
        onClick={() => router.push("/learn-hub")}
      >
        Zurueck zum Learn Hub
      </Button>

      {/* Course Header */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2">
          <Card>
            {/* Thumbnail */}
            {course.thumbnail_url && (
              <div className="relative mb-4 h-48 w-full overflow-hidden rounded-lg">
                <Image
                  src={course.thumbnail_url}
                  alt={course.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="gray" size="md">
                {course.category}
              </Badge>
              <Badge
                variant={DIFFICULTY_COLORS[course.difficulty]}
                size="md"
              >
                {DIFFICULTY_LABELS[course.difficulty]}
              </Badge>
              {course.isCompleted && (
                <Badge variant="green" size="md" dot>
                  Abgeschlossen
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="mt-3 font-display text-2xl font-bold text-surface-900">
              {course.title}
            </h1>

            {/* Author */}
            {course.author && (
              <p className="mt-1 text-body-sm text-surface-500">
                von {course.author.full_name ?? "Unbekannt"}
              </p>
            )}

            {/* Description */}
            <p className="mt-4 text-body text-surface-700">
              {course.description}
            </p>

            {/* Meta */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-body-sm text-surface-500">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>
                  {course.totalLessons}{" "}
                  {course.totalLessons === 1 ? "Lektion" : "Lektionen"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(course.duration_minutes)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4" />
                <span>{course.xp_reward} XP Belohnung</span>
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
              <ProgressBar
                value={course.progressPercentage}
                variant="gradient"
                label={`${course.completedLessons} von ${course.totalLessons} Lektionen`}
              />
            </div>

            <div className="mt-4 space-y-2">
              {/* Start / Continue Button */}
              {!course.isCompleted && nextLesson && (
                <Link href={`/learn-hub/${courseId}/${nextLesson.id}`}>
                  <Button
                    fullWidth
                    iconLeft={
                      course.isStarted ? <PlayCircle /> : <BookOpen />
                    }
                  >
                    {course.isStarted ? "Fortsetzen" : "Kurs starten"}
                  </Button>
                </Link>
              )}

              {/* Complete Course Button */}
              {allLessonsCompleted && !course.isCompleted && (
                <Button
                  fullWidth
                  variant="primary"
                  iconLeft={<Trophy />}
                  isLoading={isCompleting}
                  onClick={handleCompleteCourse}
                >
                  Kurs abschliessen
                </Button>
              )}

              {/* Completed State */}
              {course.isCompleted && (
                <div className="rounded-lg bg-lr-green-50 p-4 text-center">
                  <Award className="mx-auto h-8 w-8 text-lr-green-600" />
                  <p className="mt-2 text-body-sm font-semibold text-lr-green-700">
                    Kurs abgeschlossen!
                  </p>
                  <p className="mt-0.5 text-caption text-lr-green-600">
                    Du hast {course.xp_reward} XP erhalten
                  </p>
                  {course.certificateId && (
                    <p className="mt-1 text-caption text-surface-500">
                      Zertifikat: {course.certificateId.slice(0, 8)}...
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* XP Card */}
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lr-gold-50">
                <Star className="h-5 w-5 text-lr-gold-600" />
              </div>
              <div>
                <p className="text-caption text-surface-500">XP-Belohnung</p>
                <p className="text-title-sm font-bold text-surface-900">
                  {course.xp_reward} XP
                </p>
              </div>
            </div>
            <p className="mt-2 text-caption text-surface-500">
              + 20 XP pro abgeschlossener Lektion
            </p>
          </Card>
        </div>
      </div>

      {/* Lesson List */}
      <Card>
        <h2 className="font-heading text-title font-semibold text-surface-900">
          Lektionen
        </h2>
        <p className="mt-0.5 text-body-sm text-surface-500">
          {course.completedLessons} von {course.totalLessons} abgeschlossen
        </p>

        <div className="mt-4 space-y-2">
          {course.lessons.map((lesson, index) => {
            const LessonIcon =
              LESSON_TYPE_ICONS[lesson.lesson_type] ?? FileText;

            return (
              <Link
                key={lesson.id}
                href={`/learn-hub/${courseId}/${lesson.id}`}
                className="block"
              >
                <div
                  className={`flex items-center gap-4 rounded-lg border p-4 transition-colors ${
                    lesson.isCompleted
                      ? "border-lr-green-200 bg-lr-green-50/50"
                      : "border-surface-200 hover:border-surface-300 hover:bg-surface-50"
                  }`}
                >
                  {/* Completion Status */}
                  <div className="shrink-0">
                    {lesson.isCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-lr-green-500" />
                    ) : (
                      <Circle className="h-6 w-6 text-surface-300" />
                    )}
                  </div>

                  {/* Lesson Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-caption font-medium text-surface-400">
                        {index + 1}.
                      </span>
                      <h4
                        className={`font-heading text-body font-medium ${
                          lesson.isCompleted
                            ? "text-lr-green-700"
                            : "text-surface-900"
                        }`}
                      >
                        {lesson.title}
                      </h4>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-caption text-surface-400">
                      <div className="flex items-center gap-1">
                        <LessonIcon className="h-3.5 w-3.5" />
                        <span>
                          {LESSON_TYPE_LABELS[lesson.lesson_type] ?? "Lektion"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{lesson.duration_minutes} Min.</span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {lesson.isCompleted ? (
                      <Badge variant="green" size="sm">
                        Fertig
                      </Badge>
                    ) : (
                      <PlayCircle className="h-5 w-5 text-surface-400" />
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Card>
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
