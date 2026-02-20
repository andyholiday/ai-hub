"use client";

// =============================================================================
// Cost Dashboard Component
// Displays AI provider cost overview with monthly breakdown
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

export interface CostDashboardProps {
  /** Title period, e.g. "Februar 2026" */
  period?: string;
  /** Cost items to display */
  items?: CostItem[];
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
    color: "text-lr-green-500",
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
// Component
// -----------------------------------------------------------------------------

export function CostDashboard({
  period = "Februar 2026",
  items = DEFAULT_COSTS,
  className,
}: CostDashboardProps) {
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
        <Wallet className="h-4 w-4 text-surface-500" />
        <h3 className="font-display text-base font-semibold text-surface-900">
          Kosten-Dashboard ({period})
        </h3>
      </div>

      {/* Cost Grid */}
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
    </div>
  );
}
