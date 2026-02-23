"use client";

// =============================================================================
// Learn Hub - Learning Paths Overview Page
// Lists all published learning paths with difficulty filtering and progress.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LearningPathCard,
  type LearningPathCardData,
} from "@/components/features/learn-hub/LearningPathCard";
import {
  Route,
  Filter,
  Loader2,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  PlayCircle,
} from "lucide-react";
import type { DifficultyLevel } from "@/lib/validators/learn-hub";
import { DIFFICULTY_LABELS } from "@/constants/learn-hub";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LearningPathsPage() {
  const [paths, setPaths] = useState<LearningPathCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDifficulty, setActiveDifficulty] =
    useState<DifficultyLevel | null>(null);

  // --- Fetch Learning Paths ---
  const fetchPaths = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (activeDifficulty) params.set("difficulty", activeDifficulty);

      const res = await fetch(
        `/api/learn-hub/paths?${params.toString()}`,
      );
      const json = await res.json();

      if (json.error) {
        setError(json.error.message);
        return;
      }

      setPaths(json.data ?? []);
    } catch {
      setError("Lernpfade konnten nicht geladen werden.");
    } finally {
      setIsLoading(false);
    }
  }, [activeDifficulty]);

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  // --- Stats ---
  const completedCount = paths.filter((p) => p.isCompleted).length;
  const enrolledCount = paths.filter(
    (p) => p.isEnrolled && !p.isCompleted,
  ).length;

  return (
    <div className="space-y-6">
      {/* Back to Learn Hub */}
      <Link href="/learn-hub">
        <Button variant="ghost" size="sm" iconLeft={<ArrowLeft />}>
          Zurueck zum Learn Hub
        </Button>
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-surface-900">
          Lernpfade
        </h1>
        <p className="mt-1 text-body-sm text-surface-500">
          Strukturierte Kurs-Reihenfolgen fuer deinen optimalen Lernweg.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lr-green-50">
            <Route className="h-5 w-5 text-lr-green-600" />
          </div>
          <div>
            <p className="text-caption text-surface-500">
              Verfuegbare Lernpfade
            </p>
            <p className="text-title-sm font-semibold text-surface-900">
              {paths.length}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
            <PlayCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-caption text-surface-500">Aktive Lernpfade</p>
            <p className="text-title-sm font-semibold text-surface-900">
              {enrolledCount}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lr-gold-50">
            <CheckCircle2 className="h-5 w-5 text-lr-gold-600" />
          </div>
          <div>
            <p className="text-caption text-surface-500">Abgeschlossen</p>
            <p className="text-title-sm font-semibold text-surface-900">
              {completedCount}
            </p>
          </div>
        </Card>
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
              className={`rounded-full px-3 py-1 text-caption font-medium transition-colors ${
                activeDifficulty === level
                  ? "bg-lr-green-500 text-white"
                  : "bg-surface-100 text-surface-600 hover:bg-surface-200"
              }`}
            >
              {DIFFICULTY_LABELS[level]}
            </button>
          ),
        )}
      </div>

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
      {!isLoading && !error && paths.length === 0 && (
        <Card className="py-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-surface-300" />
          <p className="mt-4 text-title-sm font-semibold text-surface-700">
            Keine Lernpfade gefunden
          </p>
          <p className="mt-1 text-body-sm text-surface-500">
            Versuche andere Filter oder komme spaeter wieder.
          </p>
        </Card>
      )}

      {/* Learning Paths Grid */}
      {!isLoading && paths.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paths.map((path) => (
            <LearningPathCard key={path.id} path={path} />
          ))}
        </div>
      )}
    </div>
  );
}
