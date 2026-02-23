"use client";

// =============================================================================
// Learn Hub - Course Overview Page
// Lists published courses with filtering, progress tracking, and search.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import {
  BookOpen,
  Clock,
  Search,
  Filter,
  Star,
  Loader2,
  GraduationCap,
  Trophy,
} from "lucide-react";
import type { DifficultyLevel } from "@/lib/validators/learn-hub";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from "@/constants/learn-hub";
import { PageBriefingBanner } from "@/components/features/mentor-signals";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: number;
}

interface CourseWithProgress {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration_minutes: number;
  lessons_count: number;
  xp_reward: number;
  is_published: boolean;
  author: CourseAuthor | null;
  created_at: string;
  completedLessons: number;
  progressPercentage: number;
  isCompleted: boolean;
  isStarted: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LearnHubPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeDifficulty, setActiveDifficulty] =
    useState<DifficultyLevel | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // --- Fetch Courses ---
  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (activeDifficulty) params.set("difficulty", activeDifficulty);
      if (activeCategory) params.set("category", activeCategory);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(
        `/api/learn-hub/courses?${params.toString()}`,
      );

      if (res.status === 401 || res.status === 403) {
        window.location.href = "/login?redirectTo=/learn-hub";
        return;
      }

      const json = await res.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      const data = json.data ?? [];
      setCourses(data);

      // Extract unique categories from all courses
      const uniqueCategories = Array.from(
        new Set(data.map((c: CourseWithProgress) => c.category)),
      ) as string[];
      setCategories((prev) =>
        prev.length > 0 ? prev : uniqueCategories,
      );
    } catch {
      setError("Kurse konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }, [activeDifficulty, activeCategory, search]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // --- Stats ---
  const completedCount = courses.filter((c) => c.isCompleted).length;
  const inProgressCount = courses.filter(
    (c) => c.isStarted && !c.isCompleted,
  ).length;

  return (
    <div className="space-y-6">
      {/* AI Mentor Page-Entry Briefing */}
      <PageBriefingBanner pageContext="learn-hub" />

      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900">
          Learn Hub
        </h1>
        <p className="mt-1 text-body-sm text-surface-500">
          Lerne KI-Kompetenzen mit strukturierten Kursen und verdiene XP.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lr-green-50">
            <BookOpen className="h-5 w-5 text-lr-green-600" />
          </div>
          <div>
            <p className="text-caption text-surface-500">Verfuegbare Kurse</p>
            <p className="text-title-sm font-semibold text-surface-900">
              {courses.length}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <GraduationCap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-caption text-surface-500">In Bearbeitung</p>
            <p className="text-title-sm font-semibold text-surface-900">
              {inProgressCount}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lr-gold-50">
            <Trophy className="h-5 w-5 text-lr-gold-600" />
          </div>
          <div>
            <p className="text-caption text-surface-500">Abgeschlossen</p>
            <p className="text-title-sm font-semibold text-surface-900">
              {completedCount}
            </p>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Kurse durchsuchen..."
            prefixIcon={<Search />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="sm"
          />
        </div>
      </div>

      {/* Difficulty Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-surface-400" />
        <span className="text-body-sm text-surface-500">Schwierigkeit:</span>
        {(Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map(
          (level) => (
            <button
              key={level}
              onClick={() =>
                setActiveDifficulty(
                  activeDifficulty === level ? null : level,
                )
              }
              className={`rounded-full px-3 py-1 text-caption font-medium transition-colors ${activeDifficulty === level
                ? "bg-lr-green-500 text-white"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                }`}
            >
              {DIFFICULTY_LABELS[level]}
            </button>
          ),
        )}
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-body-sm text-surface-500">Kategorie:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`rounded-full px-3 py-1 text-caption font-medium transition-colors ${activeCategory === cat
                ? "bg-lr-green-500 text-white"
                : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-error bg-error-light p-4">
          <p className="text-body-sm text-error-dark">{error}</p>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-lr-green-500" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && courses.length === 0 && (
        <Card className="py-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-title-sm font-semibold text-surface-700">
            Keine Kurse gefunden
          </p>
          <p className="mt-1 text-body-sm text-surface-500">
            Versuche andere Filter oder komme spaeter wieder.
          </p>
        </Card>
      )}

      {/* Course Grid */}
      {!isLoading && courses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CourseCard Component
// ---------------------------------------------------------------------------

function CourseCard({ course }: { course: CourseWithProgress }) {
  return (
    <Card hoverable noPadding>
      <Link href={`/learn-hub/${course.id}`} className="block">
        {/* Thumbnail */}
        <div className="relative h-40 w-full overflow-hidden rounded-t-[14px] bg-surface-100">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-lr-green-100 to-lr-green-200">
              <BookOpen className="h-12 w-12 text-lr-green-400" />
            </div>
          )}

          {/* Completed Badge */}
          {course.isCompleted && (
            <div className="absolute right-2 top-2">
              <Badge variant="green" size="sm">
                Abgeschlossen
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Category & Difficulty */}
          <div className="flex items-center gap-2">
            <Badge variant="gray" size="sm">
              {course.category}
            </Badge>
            <Badge variant={DIFFICULTY_COLORS[course.difficulty]} size="sm">
              {DIFFICULTY_LABELS[course.difficulty]}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="mt-2 font-heading text-title-sm font-semibold text-surface-900 line-clamp-2">
            {course.title}
          </h3>

          {/* Description */}
          <p className="mt-1 text-body-sm text-surface-500 line-clamp-2">
            {course.description}
          </p>

          {/* Meta */}
          <div className="mt-3 flex items-center gap-4 text-caption text-surface-400">
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

          {/* Progress Bar */}
          {course.isStarted && !course.isCompleted && (
            <div className="mt-3">
              <ProgressBar
                value={course.progressPercentage}
                size="sm"
                label="Fortschritt"
                variant="gradient"
              />
            </div>
          )}

          {/* Action */}
          <div className="mt-3">
            <Button
              variant={
                course.isCompleted
                  ? "secondary"
                  : course.isStarted
                    ? "outline"
                    : "primary"
              }
              size="sm"
              fullWidth
            >
              {course.isCompleted
                ? "Erneut ansehen"
                : course.isStarted
                  ? "Fortsetzen"
                  : "Kurs starten"}
            </Button>
          </div>
        </div>
      </Link>
    </Card>
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
