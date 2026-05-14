"use client";

// =============================================================================
// AI Config Page
// Dedicated page for KI-Provider configuration.
// All handlers are wired to the real backend API via useAdminData.
// =============================================================================

import { useState, useCallback } from "react";
import { Shield, ArrowLeft, X, AlertTriangle, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  ProviderCard,
  FallbackChain,
  CostDashboard,
  SystemPrompts,
  FeatureToggles,
  ProviderSandbox,
  ProviderKeyModal,
  ProviderConfigModal,
  SystemPromptModal,
} from "@/components/features/admin";
import type { ProviderConfigValues } from "@/components/features/admin";
import { useAdminData } from "@/hooks/use-admin-data";

// -----------------------------------------------------------------------------
// Page Component
// -----------------------------------------------------------------------------

export default function AIConfigPage() {
  const admin = useAdminData();

  // --- Provider test handler ---
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

  // --- Provider config modal state ---
  const [configModalProviderId, setConfigModalProviderId] = useState<string | null>(null);

  const configModalProvider = configModalProviderId
    ? admin.providers.find((p) => p.id === configModalProviderId) ?? null
    : null;

  const configModalProviderRow = configModalProviderId
    ? admin.providerRows.find((r) => r.id === configModalProviderId) ?? null
    : null;

  const configModalInitialValues: ProviderConfigValues = configModalProvider
    ? {
        model: configModalProvider.model,
        temperature: String(configModalProvider.temperature),
        max_tokens: configModalProviderRow?.max_tokens != null
          ? String(configModalProviderRow.max_tokens)
          : "",
        top_p: configModalProviderRow?.top_p != null
          ? String(configModalProviderRow.top_p)
          : "",
        endpoint: configModalProvider.endpoint,
        budget: configModalProviderRow?.monthly_budget_limit != null
          ? String(configModalProviderRow.monthly_budget_limit)
          : "",
      }
    : { model: "", temperature: "1", max_tokens: "", top_p: "", endpoint: "", budget: "" };

  const handleOpenConfigModal = useCallback((id: string) => {
    setConfigModalProviderId(id);
  }, []);

  const handleCloseConfigModal = useCallback(() => {
    setConfigModalProviderId(null);
  }, []);

  const handleSaveConfig = useCallback(
    async (updates: Record<string, unknown>): Promise<boolean> => {
      if (!configModalProviderId) return false;
      return admin.updateProvider(configModalProviderId, updates);
    },
    [admin, configModalProviderId],
  );

  // --- API-Key modal state ---
  const [keyModalProviderId, setKeyModalProviderId] = useState<string | null>(null);

  const keyModalProvider = keyModalProviderId
    ? admin.providers.find((p) => p.id === keyModalProviderId) ?? null
    : null;

  const handleOpenKeyModal = useCallback((id: string) => {
    setKeyModalProviderId(id);
  }, []);

  const handleCloseKeyModal = useCallback(() => {
    setKeyModalProviderId(null);
  }, []);

  // "Jetzt einrichten" opens the same key modal — saving the key then
  // also activates the provider in handleSaveApiKey below.
  const handleSetupProvider = useCallback(
    (id: string) => {
      setKeyModalProviderId(id);
    },
    [],
  );

  const handleSaveApiKey = useCallback(
    async (plainKey: string): Promise<boolean> => {
      if (!keyModalProviderId) return false;
      const provider = admin.providers.find((p) => p.id === keyModalProviderId);
      const updates: Record<string, unknown> = { api_key_encrypted: plainKey };
      // Auto-activate inactive providers once a key is supplied via setup flow.
      if (provider && provider.status === "inactive") {
        updates.is_active = true;
      }
      return admin.updateProvider(keyModalProviderId, updates);
    },
    [admin, keyModalProviderId],
  );

  // --- Prompt edit modal state ---
  const [editingPrompt, setEditingPrompt] = useState<{ key: string; value: string } | null>(null);

  const handleEditPrompt = useCallback(
    (promptId: string) => {
      const row = admin.promptRows.find((r) => r.prompt_key === promptId);
      if (!row) return;
      setEditingPrompt({ key: row.prompt_key, value: row.prompt_text });
    },
    [admin.promptRows],
  );

  const handleSavePrompt = useCallback(
    async (newPrompt: string) => {
      if (!editingPrompt) return;
      const success = await admin.updatePrompt(editingPrompt.key, newPrompt);
      if (!success) throw new Error("Speichern fehlgeschlagen");
    },
    [admin, editingPrompt],
  );

  // --- Feature toggle handler ---
  const handleToggleFeature = useCallback(
    (id: string, enabled: boolean) => {
      admin.toggleFeature(id, enabled);
    },
    [admin],
  );

  // --- Stats handler ---
  const handleViewStats = useCallback(() => {
    const costSection = document.getElementById("ai-config-cost-dashboard");
    costSection?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // --- Determine if initial load is in progress ---
  const isInitialLoading =
    admin.providersLoading &&
    admin.costsLoading &&
    admin.promptsLoading &&
    admin.featuresLoading;

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="mb-7">
        <Link
          href="/admin"
          className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-surface-500 transition-colors hover:text-brand-primary-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zurueck zum Admin Panel
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary-50">
            <Shield className="h-5 w-5 text-brand-primary-600" strokeWidth={2} />
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
        <div className="mb-5 flex items-start gap-3 rounded-[14px] border border-brand-primary-200 bg-brand-primary-50 p-4">
          <div className="flex-1 text-[13px] text-brand-primary-700">{testMessage}</div>
          <button
            onClick={() => setTestMessage(null)}
            className="shrink-0 rounded-md p-1 text-brand-primary-400 transition-colors hover:bg-brand-primary-100 hover:text-brand-primary-600"
            aria-label="Nachricht schliessen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Content */}
      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary-500" />
          <p className="text-sm text-surface-500">Daten werden geladen...</p>
        </div>
      ) : (
        <div className="space-y-5">
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
                  onEdit={handleOpenConfigModal}
                  onTest={handleTestProvider}
                  onSetPrimary={admin.setProviderPrimary}
                  onSetup={handleSetupProvider}
                  onStats={handleViewStats}
                  onSetApiKey={handleOpenKeyModal}
                  className={
                    testingId === provider.id
                      ? "ring-2 ring-brand-primary-500 ring-offset-2"
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
          <div id="ai-config-cost-dashboard">
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
        </div>
      )}

      {/* API-Key Modal */}
      <ProviderKeyModal
        isOpen={keyModalProviderId !== null}
        providerName={keyModalProvider?.name ?? ""}
        hasKey={
          keyModalProvider !== null &&
          keyModalProvider.apiKeyMasked !== "Nicht hinterlegt"
        }
        onSave={handleSaveApiKey}
        onClose={handleCloseKeyModal}
      />

      {/* Provider Config Modal */}
      <ProviderConfigModal
        isOpen={configModalProviderId !== null}
        providerName={configModalProvider?.name ?? ""}
        initialValues={configModalInitialValues}
        onSave={handleSaveConfig}
        onClose={handleCloseConfigModal}
      />

      {/* System Prompt Modal */}
      <SystemPromptModal
        open={editingPrompt !== null}
        initialPrompt={editingPrompt?.value ?? ""}
        promptKey={editingPrompt?.key ?? ""}
        onSave={handleSavePrompt}
        onClose={() => setEditingPrompt(null)}
      />
    </div>
  );
}
