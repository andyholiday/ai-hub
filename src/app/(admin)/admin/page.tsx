"use client";

// =============================================================================
// Admin Panel - Main Page
// Shows the KI-Provider tab by default with all admin sections.
// All handlers are wired to the real backend API via useAdminData.
// =============================================================================

import { useState, useCallback } from "react";
import { Shield, X, AlertTriangle, Loader2 } from "lucide-react";
import {
  AdminTabs,
  ProviderCard,
  FallbackChain,
  CostDashboard,
  ProviderSandbox,
  SystemPrompts,
  FeatureToggles,
} from "@/components/features/admin";
import { AdminUsersTab } from "@/components/features/admin/admin-users";
import { AdminContentTab } from "@/components/features/admin/admin-content";
import { AdminGamificationTab } from "@/components/features/admin/admin-gamification";
import { useAdminData } from "@/hooks/use-admin-data";

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("ai-provider");
  const admin = useAdminData();

  // --- Provider test handler (shows result as global message) ---
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const handleTestProvider = useCallback(
    async (id: string) => {
      setTestingId(id);
      setTestMessage(null);

      const result = await admin.testProvider(id);

      setTestingId(null);

      if (result) {
        const status = result.available ? "erreichbar" : "nicht erreichbar";
        const latency = result.latency_ms ? ` (${result.latency_ms}ms)` : "";
        const errMsg = result.error ? ` - ${result.error}` : "";
        setTestMessage(
          `${result.display_name}: ${status}${latency}${errMsg}`,
        );
      }
    },
    [admin],
  );

  // --- Provider edit handler (update temperature as example) ---
  const handleEditProvider = useCallback(
    (id: string) => {
      // In a full implementation this would open a modal.
      // For now, we prompt for the temperature value.
      const provider = admin.providers.find((p) => p.id === id);
      if (!provider) return;

      const newTemp = window.prompt(
        `Temperature fuer ${provider.name} (aktuell: ${provider.temperature}):`,
        String(provider.temperature),
      );

      if (newTemp === null) return;

      const parsed = parseFloat(newTemp);
      if (isNaN(parsed) || parsed < 0 || parsed > 2) {
        admin.dismissError();
        return;
      }

      admin.updateProvider(id, { temperature: parsed });
    },
    [admin],
  );

  // --- Provider setup handler (activate and open edit) ---
  const handleSetupProvider = useCallback(
    async (id: string) => {
      await admin.updateProvider(id, { is_active: true });
    },
    [admin],
  );

  // --- Prompt edit handler ---
  const handleEditPrompt = useCallback(
    (promptId: string) => {
      const prompt = admin.prompts.find((p) => p.id === promptId);
      if (!prompt) return;

      const newText = window.prompt(
        `Prompt-Text fuer "${prompt.name}" bearbeiten:`,
      );

      if (newText === null || newText.trim() === "") return;

      admin.updatePrompt(promptId, newText.trim());
    },
    [admin],
  );

  // --- Feature toggle handler ---
  const handleToggleFeature = useCallback(
    (id: string, enabled: boolean) => {
      admin.toggleFeature(id, enabled);
    },
    [admin],
  );

  // --- Stats handler (navigate to costs section) ---
  const handleViewStats = useCallback(() => {
    const costSection = document.getElementById("cost-dashboard-section");
    costSection?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // --- Determine if any section is still loading ---
  const isInitialLoading =
    admin.providersLoading &&
    admin.costsLoading &&
    admin.promptsLoading &&
    admin.featuresLoading;

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

      {/* Global Error Banner */}
      {admin.globalError && (
        <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="flex-1 text-[13px] text-red-700">{admin.globalError}</div>
          <button
            onClick={admin.dismissError}
            className="shrink-0 rounded-md p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
            aria-label="Fehlermeldung schliessen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Test Result Banner */}
      {testMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-lr-green-200 bg-lr-green-50 p-4">
          <div className="flex-1 text-[13px] text-lr-green-700">{testMessage}</div>
          <button
            onClick={() => setTestMessage(null)}
            className="shrink-0 rounded-md p-1 text-lr-green-400 transition-colors hover:bg-lr-green-100 hover:text-lr-green-600"
            aria-label="Nachricht schliessen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <AdminTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-7"
      />

      {/* Tab Content */}
      {activeTab === "ai-provider" && (
        <div className="space-y-5 animate-fade-in">
          {/* Initial Loading State */}
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-lr-green-500" />
              <p className="text-sm text-surface-500">Daten werden geladen...</p>
            </div>
          ) : (
            <>
              {/* Provider Cards Grid */}
              {admin.providersLoading ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-[14px] border border-surface-200 bg-white p-6"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="h-12 w-12 rounded-xl bg-surface-200" />
                        <div className="flex-1">
                          <div className="h-4 w-32 rounded bg-surface-200" />
                          <div className="mt-2 h-3 w-48 rounded bg-surface-100" />
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="h-14 rounded-lg bg-surface-100" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : admin.providersError ? (
                <div className="rounded-[14px] border border-red-200 bg-red-50 p-6 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-red-400" />
                  <p className="mt-2 text-sm text-red-600">{admin.providersError}</p>
                  <button
                    onClick={admin.fetchProviders}
                    className="mt-3 text-[13px] font-semibold text-red-600 underline hover:no-underline"
                  >
                    Erneut versuchen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {admin.providers.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      onEdit={handleEditProvider}
                      onTest={handleTestProvider}
                      onSetPrimary={admin.setProviderPrimary}
                      onSetup={handleSetupProvider}
                      onStats={handleViewStats}
                      className={
                        testingId === provider.id
                          ? "ring-2 ring-lr-green-500 ring-offset-2"
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}

              {/* Fallback Chain */}
              <FallbackChain
                items={admin.chainItems.length > 0 ? admin.chainItems : undefined}
              />

              {/* Cost Dashboard */}
              <div id="cost-dashboard-section">
                <CostDashboard
                  period={admin.costPeriodLabel}
                  items={admin.costItems.length > 0 ? admin.costItems : undefined}
                  activePeriod={admin.costPeriod}
                  onPeriodChange={admin.setCostPeriod}
                  isLoading={admin.costsLoading}
                  error={admin.costsError}
                />
              </div>

              {/* System Prompts */}
              <SystemPrompts
                prompts={admin.prompts.length > 0 ? admin.prompts : undefined}
                onEdit={handleEditPrompt}
              />

              {/* Feature Toggles */}
              <FeatureToggles
                features={admin.features.length > 0 ? admin.features : undefined}
                onToggle={handleToggleFeature}
              />

              {/* Provider Sandbox */}
              <ProviderSandbox
                results={admin.sandboxResults.length > 0 ? admin.sandboxResults : undefined}
                onTest={admin.testAllProviders}
                isLoading={admin.sandboxLoading}
                error={admin.sandboxError}
              />
            </>
          )}
        </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab === "users" && <AdminUsersTab />}
      {activeTab === "analytics" && (
        <PlaceholderTab
          title="Analytics Dashboard"
          description="Nutzungsstatistiken, Content-Metriken und KI-Auswertungen."
        />
      )}
      {activeTab === "gamification" && <AdminGamificationTab />}
      {activeTab === "content" && <AdminContentTab />}
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
