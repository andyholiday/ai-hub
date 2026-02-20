"use client";

// =============================================================================
// Admin Panel - Main Page
// Shows the KI-Provider tab by default with all admin sections
// =============================================================================

import { useState } from "react";
import { Shield } from "lucide-react";
import {
  AdminTabs,
  ProviderCard,
  FallbackChain,
  CostDashboard,
  SystemPrompts,
  FeatureToggles,
  ProviderSandbox,
} from "@/components/features/admin";
import type { ProviderData } from "@/components/features/admin";

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

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("ai-provider");

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lr-green-50">
            <Shield className="h-5 w-5 text-lr-green-600" strokeWidth={2} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-surface-900">
              Admin Panel
            </h1>
            <p className="mt-0.5 text-sm text-surface-500">
              Plattform-Konfiguration, KI-Provider und System-Einstellungen
            </p>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <AdminTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-7"
      />

      {/* Tab Content */}
      {activeTab === "ai-provider" && (
        <div className="space-y-5 animate-fade-in">
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
          <SystemPrompts
            onEdit={(id) => console.log("Edit Prompt:", id)}
          />

          {/* Feature Toggles */}
          <FeatureToggles
            onToggle={(id, enabled) =>
              console.log("Toggle:", id, enabled)
            }
          />

          {/* Provider Sandbox */}
          <ProviderSandbox />
        </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab === "users" && (
        <PlaceholderTab
          title="Benutzer-Verwaltung"
          description="Benutzerliste, Rollen und Berechtigungen verwalten."
        />
      )}
      {activeTab === "analytics" && (
        <PlaceholderTab
          title="Analytics Dashboard"
          description="Nutzungsstatistiken, Content-Metriken und KI-Auswertungen."
        />
      )}
      {activeTab === "gamification" && (
        <PlaceholderTab
          title="Gamification-Management"
          description="XP-Werte, Levels, Badges und Challenges konfigurieren."
        />
      )}
      {activeTab === "content" && (
        <PlaceholderTab
          title="Content-Management"
          description="Best Practices moderieren, Kurse und Kategorien verwalten."
        />
      )}
      {activeTab === "system" && (
        <PlaceholderTab
          title="System-Einstellungen"
          description="E-Mail-Konfiguration, Wartungsmodus und Audit-Log."
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Placeholder Tab (for non-implemented tabs)
// -----------------------------------------------------------------------------

function PlaceholderTab({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="animate-fade-in rounded-[14px] border border-dashed border-surface-300 bg-white p-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100">
        <Shield className="h-6 w-6 text-surface-400" />
      </div>
      <h3 className="font-display text-lg font-semibold text-surface-800">
        {title}
      </h3>
      <p className="mt-1 text-sm text-surface-500">{description}</p>
      <p className="mt-4 text-xs text-surface-400">
        Dieses Modul wird in einer zukuenftigen Version implementiert.
      </p>
    </div>
  );
}
