// =============================================================================
// CategoryFilter Component
// Horizontal scrollable category tabs/chips for Best Practices filtering
// =============================================================================

"use client";

import { useRef } from "react";
import {
  Layers,
  MessageSquareText,
  Wrench,
  Workflow,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { BestPracticeCategory } from "./best-practice-card";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type CategoryFilterValue = BestPracticeCategory | "all";

export interface CategoryFilterProps {
  value: CategoryFilterValue;
  onChange: (category: CategoryFilterValue) => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Category Definitions
// -----------------------------------------------------------------------------

interface CategoryDef {
  id: CategoryFilterValue;
  label: string;
  icon: React.ReactNode;
  activeClasses: string;
  inactiveClasses: string;
}

const categories: CategoryDef[] = [
  {
    id: "all",
    label: "Alle",
    icon: <Layers className="h-4 w-4" />,
    activeClasses: "bg-surface-800 text-white border-surface-800",
    inactiveClasses:
      "bg-white text-surface-600 border-surface-300 hover:bg-surface-50 hover:border-surface-400",
  },
  {
    id: "prompt-engineering",
    label: "Prompt Engineering",
    icon: <MessageSquareText className="h-4 w-4" />,
    activeClasses: "bg-brand-primary-500 text-white border-brand-primary-500",
    inactiveClasses:
      "bg-white text-surface-600 border-surface-300 hover:bg-brand-primary-50 hover:border-brand-primary-300 hover:text-brand-primary-700",
  },
  {
    id: "ki-tools",
    label: "KI-Tools",
    icon: <Wrench className="h-4 w-4" />,
    activeClasses: "bg-info text-white border-info",
    inactiveClasses:
      "bg-white text-surface-600 border-surface-300 hover:bg-info-light hover:border-blue-300 hover:text-info-dark",
  },
  {
    id: "automatisierung",
    label: "Automatisierung",
    icon: <Workflow className="h-4 w-4" />,
    activeClasses: "bg-purple-600 text-white border-purple-600",
    inactiveClasses:
      "bg-white text-surface-600 border-surface-300 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700",
  },
  {
    id: "datenanalyse",
    label: "Datenanalyse",
    icon: <BarChart3 className="h-4 w-4" />,
    activeClasses: "bg-brand-accent-500 text-white border-brand-accent-500",
    inactiveClasses:
      "bg-white text-surface-600 border-surface-300 hover:bg-brand-accent-50 hover:border-brand-accent-300 hover:text-brand-accent-800",
  },
  {
    id: "ki-ethik",
    label: "KI-Ethik",
    icon: <ShieldCheck className="h-4 w-4" />,
    activeClasses: "bg-error text-white border-error",
    inactiveClasses:
      "bg-white text-surface-600 border-surface-300 hover:bg-error-light hover:border-red-300 hover:text-error-dark",
  },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function CategoryFilter({ value, onChange, className }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn("relative", className)}>
      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        role="tablist"
        aria-label="Kategorien filtern"
      >
        {categories.map((cat) => {
          const isActive = value === cat.id;

          return (
            <button
              key={cat.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(cat.id)}
              className={cn(
                // Base
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2",
                "text-body-sm font-medium",
                "transition-all duration-200 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500 focus-visible:ring-offset-2",
                // Active/Inactive state
                isActive ? cat.activeClasses : cat.inactiveClasses
              )}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
