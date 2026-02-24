"use client";

// =============================================================================
// Cost Dashboard Component
// Displays AI provider cost overview with period filter
// =============================================================================

import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CostItem {
  id: string;
  label: string;
  amount: string;
  subInfo: string;
  color?: string;
}

export type CostPeriod = "day" | "week" | "month";

export interface CostDashboardProps {
  /** Title period, e.g. "Februar 2026" */
  period?: string;
  /** Cost items to display */
  items?: CostItem[];
  /** Currently selected period filter */
  activePeriod?: CostPeriod;
  /** Callback when period filter changes */
  onPeriodChange?: (period: CostPeriod) => void;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Additional CSS classes */
  className?: string;
}

// -----------------------------------------------------------------------------
// Default Demo Data
// -----------------------------------------------------------------------------

const DEFAULT_COSTS: CostItem[] = [
  {
    id: "total",
    label: "Gesamt-Kosten",
    amount: "\u20AC 156,80",
    subInfo: "Budget: \u20AC 300/Monat",
    color: "text-surface-900",
  },
  {
    id: "gemini",
    label: "Gemini (Primaer)",
    amount: "\u20AC 124,50",
    subInfo: "1.2M Tokens verbraucht",
    color: "text-brand-primary-500",
  },
  {
    id: "claude",
    label: "Claude (Fallback)",
    amount: "\u20AC 28,30",
    subInfo: "180K Tokens (3 Fallbacks)",
    color: "text-amber-500",
  },
  {
    id: "chatgpt",
    label: "ChatGPT",
    amount: "\u20AC 4,00",
    subInfo: "42K Tokens (1 Fallback)",
    color: "text-surface-400",
  },
];

// -----------------------------------------------------------------------------
// Period filter labels
// -----------------------------------------------------------------------------

const PERIOD_OPTIONS: { value: CostPeriod; label: string }[] = [
  { value: "day", label: "Heute" },
  { value: "week", label: "Woche" },
  { value: "month", label: "Monat" },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function CostDashboard({
  period = "Februar 2026",
  items = DEFAULT_COSTS,
  activePeriod = "month",
  onPeriodChange,
  isLoading = false,
  error,
  className,
}: CostDashboardProps) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-surface-200 bg-white p-6 shadow-card",
        className
      )}
    >
      {/* Section Title + Period Filter */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-[3px] rounded-sm bg-brand-primary-500" />
          <Wallet className="h-4 w-4 text-surface-500" />
          <h3 className="font-display text-base font-semibold text-surface-900">
            Kosten-Dashboard ({period})
          </h3>
        </div>

        {/* Period Filter Buttons */}
        {onPeriodChange && (
          <div className="flex gap-1 rounded-lg border border-surface-200 bg-surface-50 p-0.5">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onPeriodChange(opt.value)}
                className={cn(
                  "rounded-md px-3 py-1 text-[11px] font-semibold transition-all duration-150",
                  activePeriod === opt.value
                    ? "bg-brand-primary-500 text-white shadow-sm"
                    : "text-surface-500 hover:text-surface-800"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-surface-100 bg-white p-4.5 shadow-card"
            >
              <div className="h-3 w-20 rounded bg-surface-200" />
              <div className="mt-3 h-7 w-24 rounded bg-surface-200" />
              <div className="mt-2 h-2.5 w-32 rounded bg-surface-100" />
            </div>
          ))}
        </div>
      ) : (
        /* Cost Grid */
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-surface-100 bg-white p-4.5 shadow-card"
            >
              {/* Label */}
              <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-surface-400">
                {item.label}
              </div>

              {/* Amount */}
              <div
                className={cn(
                  "mt-1.5 font-display text-2xl font-bold",
                  item.color || "text-surface-900"
                )}
              >
                {item.amount}
              </div>

              {/* Sub Info */}
              <div className="mt-0.5 text-[11px] text-surface-400">{item.subInfo}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
