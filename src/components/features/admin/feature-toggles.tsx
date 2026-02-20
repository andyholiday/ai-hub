"use client";

// =============================================================================
// Feature Toggles Component
// Toggle switches for enabling/disabling platform features
// =============================================================================

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Toggle } from "@/components/ui";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface FeatureToggleItem {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface FeatureTogglesProps {
  /** List of features */
  features?: FeatureToggleItem[];
  /** Callback when a toggle changes */
  onToggle?: (id: string, enabled: boolean) => void;
  /** Additional CSS classes */
  className?: string;
}

// -----------------------------------------------------------------------------
// Default Demo Data
// -----------------------------------------------------------------------------

const DEFAULT_FEATURES: FeatureToggleItem[] = [
  {
    id: "ai-mentor",
    name: "AI Mentor",
    description: "KI-Chat-Assistent fuer alle Benutzer",
    enabled: true,
  },
  {
    id: "usecase-eval",
    name: "Use-Case Bewertung",
    description: "Automatische KI-Bewertung eingereichte Ideen",
    enabled: true,
  },
  {
    id: "semantic-search",
    name: "Semantische Suche",
    description: "KI-gestuetzte Suche via pgvector",
    enabled: true,
  },
  {
    id: "auto-tagging",
    name: "Auto-Tagging",
    description: "Automatische Verschlagwortung neuer Inhalte",
    enabled: true,
  },
  {
    id: "ai-orb",
    name: "AI Orb (Floating Assistant)",
    description: "Persistenter KI-Begleiter auf allen Seiten",
    enabled: true,
  },
  {
    id: "gamification",
    name: "Gamification",
    description: "XP-System, Levels und Badges",
    enabled: true,
  },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function FeatureToggles({
  features: initialFeatures,
  onToggle,
  className,
}: FeatureTogglesProps) {
  const [features, setFeatures] = useState<FeatureToggleItem[]>(
    initialFeatures ?? DEFAULT_FEATURES
  );

  const handleToggle = (id: string, enabled: boolean) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled } : f))
    );
    onToggle?.(id, enabled);
  };

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
        <SlidersHorizontal className="h-4 w-4 text-surface-500" />
        <h3 className="font-display text-base font-semibold text-surface-900">
          Feature-Schalter
        </h3>
      </div>

      {/* Toggle Rows */}
      <div className="divide-y divide-surface-100">
        {features.map((feature) => (
          <div
            key={feature.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            {/* Feature Info */}
            <div className="min-w-0 flex-1">
              <h4 className="text-[13px] font-semibold text-surface-900">
                {feature.name}
              </h4>
              <p className="mt-0.5 text-[11px] text-surface-400">
                {feature.description}
              </p>
            </div>

            {/* Toggle Switch */}
            <Toggle
              checked={feature.enabled}
              onChange={(checked) => handleToggle(feature.id, checked)}
              size="md"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
