"use client";

// =============================================================================
// Provider Card Component
// Displays a single AI provider's configuration and status
// =============================================================================

import { Pencil, Wrench, BarChart3, ArrowUp, Settings } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type ProviderStatus = "primary" | "fallback" | "inactive";

export interface ProviderData {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  endpoint: string;
  model: string;
  apiKeyMasked: string;
  temperature: number;
  costPerMonth?: string;
  status: ProviderStatus;
  statusLabel: string;
  fallbackOrder?: number;
}

export interface ProviderCardProps {
  provider: ProviderData;
  onEdit?: (id: string) => void;
  onTest?: (id: string) => void;
  onSetPrimary?: (id: string) => void;
  onSetup?: (id: string) => void;
  onStats?: (id: string) => void;
  className?: string;
}

// -----------------------------------------------------------------------------
// Status Styles
// -----------------------------------------------------------------------------

const statusDotStyles: Record<ProviderStatus, string> = {
  primary: "bg-emerald-500",
  fallback: "bg-amber-500",
  inactive: "bg-red-500",
};

const statusTextStyles: Record<ProviderStatus, string> = {
  primary: "text-emerald-600",
  fallback: "text-amber-500",
  inactive: "text-red-500",
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ProviderCard({
  provider,
  onEdit,
  onTest,
  onSetPrimary,
  onSetup,
  onStats,
  className,
}: ProviderCardProps) {
  const isPrimary = provider.status === "primary";
  const isInactive = provider.status === "inactive";

  return (
    <div
      className={cn(
        "relative rounded-[14px] border bg-white p-6 shadow-card transition-all duration-200",
        "hover:shadow-card-hover",
        isPrimary && "border-brand-primary-500 shadow-[0_0_0_2px_rgba(0,166,81,0.1)]",
        !isPrimary && !isInactive && "border-surface-200",
        isInactive && "border-surface-200 opacity-70",
        className
      )}
    >
      {/* Green top bar for primary provider */}
      {isPrimary && (
        <div className="absolute inset-x-0 top-0 h-[3px] rounded-t-[14px] bg-brand-primary-500" />
      )}

      {/* Header */}
      <div className="mb-4 flex items-center gap-3.5">
        {/* Provider Icon */}
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          )}
          style={{ backgroundColor: provider.iconBg }}
        >
          {provider.icon}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-surface-900">{provider.name}</h3>
          <p className="truncate text-xs text-surface-400">{provider.endpoint}</p>
        </div>

        {/* Status Indicator */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn("h-2 w-2 shrink-0 rounded-full", statusDotStyles[provider.status])}
            aria-hidden="true"
          />
          <span
            className={cn("text-[11px] font-semibold", statusTextStyles[provider.status])}
          >
            {provider.statusLabel}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        {/* Model */}
        <div className="rounded-lg bg-[#F7F8FA] px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.5px] text-surface-400">
            Modell
          </div>
          <div className={cn(
            "mt-0.5 text-[13px] font-semibold",
            isInactive ? "text-surface-400" : "text-surface-900"
          )}>
            {provider.model}
          </div>
        </div>

        {/* API Key */}
        <div className="rounded-lg bg-[#F7F8FA] px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.5px] text-surface-400">
            API-Key
          </div>
          <div className={cn(
            "mt-0.5 font-mono text-xs font-semibold",
            isInactive ? "text-surface-400" : "text-surface-900"
          )}>
            {provider.apiKeyMasked}
          </div>
        </div>

        {/* Temperature / Endpoint (inactive) */}
        <div className="rounded-lg bg-[#F7F8FA] px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.5px] text-surface-400">
            {isInactive ? "Endpoint" : "Temperature"}
          </div>
          <div className={cn(
            "mt-0.5 text-[13px] font-semibold",
            isInactive ? "text-surface-400" : "text-surface-900"
          )}>
            {isInactive ? "Nicht konfiguriert" : provider.temperature.toString()}
          </div>
        </div>

        {/* Cost / Status */}
        <div className="rounded-lg bg-[#F7F8FA] px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.5px] text-surface-400">
            {isPrimary ? "Kosten/Monat" : "Status"}
          </div>
          <div
            className={cn(
              "mt-0.5 text-[13px] font-semibold",
              isPrimary && "text-brand-primary-500",
              provider.status === "fallback" && "text-amber-500",
              isInactive && "text-surface-400"
            )}
          >
            {isPrimary
              ? provider.costPerMonth
              : provider.status === "fallback"
                ? "Bereit"
                : "Inaktiv"}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isInactive ? (
          <Button
            size="sm"
            variant="primary"
            iconLeft={<Settings />}
            onClick={() => onSetup?.(provider.id)}
          >
            Jetzt einrichten
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant={isPrimary ? "primary" : "ghost"}
              iconLeft={<Pencil />}
              onClick={() => onEdit?.(provider.id)}
            >
              Bearbeiten
            </Button>
            <Button
              size="sm"
              variant="ghost"
              iconLeft={<Wrench />}
              onClick={() => onTest?.(provider.id)}
            >
              Testen
            </Button>
            {isPrimary ? (
              <Button
                size="sm"
                variant="ghost"
                iconLeft={<BarChart3 />}
                onClick={() => onStats?.(provider.id)}
              >
                Statistik
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                iconLeft={<ArrowUp />}
                onClick={() => onSetPrimary?.(provider.id)}
              >
                Als Primaer setzen
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
