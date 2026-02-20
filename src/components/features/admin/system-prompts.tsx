"use client";

// =============================================================================
// System Prompts Component
// Management interface for AI system prompts with versioning
// =============================================================================

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SystemPromptItem {
  id: string;
  name: string;
  description: string;
  version: string;
}

export interface SystemPromptsProps {
  /** List of system prompts */
  prompts?: SystemPromptItem[];
  /** Callback when edit is clicked */
  onEdit?: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// -----------------------------------------------------------------------------
// Default Demo Data
// -----------------------------------------------------------------------------

const DEFAULT_PROMPTS: SystemPromptItem[] = [
  {
    id: "mentor-main",
    name: "AI Mentor \u2013 Haupt-Prompt",
    description: "Persoenlichkeit und Verhalten des AI Mentors definieren",
    version: "v3.2",
  },
  {
    id: "usecase-eval",
    name: "Use-Case Bewertung",
    description: "Bewertungskriterien und Scoring-Prompt fuer KI-Ideen",
    version: "v2.1",
  },
  {
    id: "auto-tagging",
    name: "Auto-Tagging",
    description: "Automatische Kategorisierung neuer Beitraege",
    version: "v1.4",
  },
  {
    id: "summaries",
    name: "Zusammenfassungen",
    description: "TL;DR Generierung fuer Best Practices",
    version: "v1.1",
  },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function SystemPrompts({
  prompts = DEFAULT_PROMPTS,
  onEdit,
  className,
}: SystemPromptsProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-surface-200 bg-white p-6 shadow-card",
        className
      )}
    >
      {/* Section Title */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-[3px] rounded-sm bg-lr-green-500" />
        <FileText className="h-4 w-4 text-surface-500" />
        <h3 className="font-display text-base font-semibold text-surface-900">
          System-Prompts
        </h3>
      </div>

      {/* Prompt Rows */}
      <div className="divide-y divide-surface-100">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            {/* Prompt Info */}
            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-semibold text-surface-900">
                {prompt.name}
              </h4>
              <p className="mt-0.5 text-[11px] text-surface-400">
                {prompt.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit?.(prompt.id)}
              >
                Bearbeiten
              </Button>
              <span className="text-[11px] text-surface-400">{prompt.version}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
