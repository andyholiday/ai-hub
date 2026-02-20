"use client";

// =============================================================================
// Fallback Chain Component
// Visual representation of the AI provider fallback priority
// =============================================================================

import { ArrowRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface ChainItem {
  id: string;
  name: string;
  icon: string;
  role: "primary" | "fallback" | "inactive";
  label: string;
}

export interface FallbackChainProps {
  items?: ChainItem[];
  className?: string;
}

// -----------------------------------------------------------------------------
// Default Chain Data
// -----------------------------------------------------------------------------

const DEFAULT_CHAIN: ChainItem[] = [
  { id: "gemini", name: "Gemini", icon: "\u2728", role: "primary", label: "Primaer" },
  { id: "claude", name: "Claude", icon: "\uD83D\uDFE0", role: "fallback", label: "Fallback 1" },
  { id: "chatgpt", name: "ChatGPT", icon: "\uD83D\uDCAC", role: "fallback", label: "Fallback 2" },
  { id: "copilot", name: "Copilot", icon: "\uD83D\uDD37", role: "inactive", label: "Inaktiv" },
];

// -----------------------------------------------------------------------------
// Role Styles
// -----------------------------------------------------------------------------

const roleStyles: Record<string, string> = {
  primary: "border-lr-green-500/20 bg-lr-green-50 text-lr-green-600",
  fallback: "border-amber-300 bg-orange-50 text-amber-500",
  inactive: "border-surface-200 bg-surface-50 text-surface-400",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function FallbackChain({
  items = DEFAULT_CHAIN,
  className,
}: FallbackChainProps) {
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
        <RefreshCw className="h-4 w-4 text-surface-500" />
        <h3 className="font-display text-base font-semibold text-surface-900">
          Fallback-Kette
        </h3>
      </div>

      {/* Description */}
      <p className="mb-3 text-[13px] leading-relaxed text-surface-500">
        Wenn der primaere Provider nicht verfuegbar ist, wird automatisch der naechste
        in der Kette verwendet.
      </p>

      {/* Chain Visualization */}
      <div className="flex flex-wrap items-center gap-2 rounded-[10px] bg-[#F7F8FA] p-4">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            {/* Chain Item */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5",
                "text-xs font-semibold",
                roleStyles[item.role]
              )}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>
                {item.name} ({item.label})
              </span>
            </div>

            {/* Arrow (not after last item) */}
            {index < items.length - 1 && (
              <ArrowRight
                className="h-4 w-4 shrink-0 text-surface-400"
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
