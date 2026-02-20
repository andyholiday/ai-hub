"use client";

// =============================================================================
// AI Config Page
// Dedicated page for KI-Provider configuration
// Redirects to admin page with ai-provider tab active,
// or can be used as standalone view
// =============================================================================

import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  ProviderCard,
  FallbackChain,
  CostDashboard,
  SystemPrompts,
  FeatureToggles,
  ProviderSandbox,
} from "@/components/features/admin";
import type { ProviderData } from "@/components/features/admin";
import { Button } from "@/components/ui";

// -----------------------------------------------------------------------------
// Static Demo Data - AI Providers
// -----------------------------------------------------------------------------

const PROVIDERS: ProviderData[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    icon: "\u2728",
    iconBg: "#E8F5E9",
    endpoint: "generativelanguage.googleapis.com",
    model: "Gemini 2.5 Pro",
    apiKeyMasked: "AIza...\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    temperature: 0.7,
    costPerMonth: "\u20AC 124,50",
    status: "primary",
    statusLabel: "Primaer",
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    icon: "\uD83D\uDFE0",
    iconBg: "#FFF3E0",
    endpoint: "api.anthropic.com",
    model: "Claude Sonnet 4.5",
    apiKeyMasked: "sk-ant...\u2022\u2022\u2022\u2022\u2022\u2022",
    temperature: 0.7,
    status: "fallback",
    statusLabel: "Fallback 1",
    fallbackOrder: 1,
  },
  {
    id: "chatgpt",
    name: "OpenAI ChatGPT",
    icon: "\uD83D\uDCAC",
    iconBg: "#E3F2FD",
    endpoint: "api.openai.com",
    model: "GPT-4o",
    apiKeyMasked: "sk-proj...\u2022\u2022\u2022\u2022",
    temperature: 0.7,
    status: "fallback",
    statusLabel: "Fallback 2",
    fallbackOrder: 2,
  },
  {
    id: "copilot",
    name: "Microsoft Copilot",
    icon: "\uD83D\uDD37",
    iconBg: "#F3E5F5",
    endpoint: "Azure OpenAI Service",
    model: "GPT-4o via Azure",
    apiKeyMasked: "Nicht hinterlegt",
    temperature: 0.7,
    status: "inactive",
    statusLabel: "Nicht konfiguriert",
  },
];

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function AIConfigPage() {
  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-7">
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-surface-500 transition-colors hover:text-lr-green-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurueck zum Admin Panel
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lr-green-50">
            <Shield className="h-5 w-5 text-lr-green-600" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              KI-Provider Konfiguration
            </h1>
            <p className="mt-0.5 text-sm text-surface-500">
              Provider verwalten, Fallback-Kette und Kosten im Blick
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-5">
        {/* Provider Cards Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {PROVIDERS.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onEdit={(id) => console.log("Edit:", id)}
              onTest={(id) => console.log("Test:", id)}
              onSetPrimary={(id) => console.log("Set Primary:", id)}
              onSetup={(id) => console.log("Setup:", id)}
              onStats={(id) => console.log("Stats:", id)}
            />
          ))}
        </div>

        {/* Fallback Chain */}
        <FallbackChain />

        {/* Cost Dashboard */}
        <CostDashboard />

        {/* System Prompts */}
        <SystemPrompts onEdit={(id) => console.log("Edit Prompt:", id)} />

        {/* Feature Toggles */}
        <FeatureToggles
          onToggle={(id, enabled) => console.log("Toggle:", id, enabled)}
        />

        {/* Provider Sandbox */}
        <ProviderSandbox />
      </div>
    </div>
  );
}
