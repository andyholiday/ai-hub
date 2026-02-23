"use client";

// =============================================================================
// LearningPathProgress Component
// Progress indicator for learning paths showing completion as a bar
// with course count label.
// =============================================================================

import { ProgressBar } from "@/components/ui/progress-bar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LearningPathProgressProps {
  completedCourses: number;
  totalCourses: number;
  overallProgress: number;
  /** Size variant for the progress bar */
  size?: "sm" | "md" | "lg";
  /** Whether to show the course count label */
  showLabel?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LearningPathProgress({
  completedCourses,
  totalCourses,
  overallProgress,
  size = "md",
  showLabel = true,
}: LearningPathProgressProps) {
  return (
    <ProgressBar
      value={overallProgress}
      size={size}
      variant="gradient"
      label={
        showLabel
          ? `${completedCourses} von ${totalCourses} ${totalCourses === 1 ? "Kurs" : "Kursen"}`
          : undefined
      }
      showLabel={showLabel}
    />
  );
}
