"use client";

// =============================================================================
// useAdminData Hook
// Central data management for all Admin Panel API interactions.
// Provides fetch, mutation, loading & error states for:
//   - AI Providers
//   - Cost Dashboard
//   - System Prompts
//   - Feature Flags
// =============================================================================

import { useState, useEffect, useCallback, useRef } from "react";
import type { ApiResponse } from "@/types/api";
import type { Tables } from "@/lib/supabase/types";
import type { ProviderData, ProviderStatus } from "@/components/features/admin/provider-card";
import type { CostItem } from "@/components/features/admin/cost-dashboard";
import type { SystemPromptItem } from "@/components/features/admin/system-prompts";
import type { FeatureToggleItem } from "@/components/features/admin/feature-toggles";
import type { ChainItem } from "@/components/features/admin/fallback-chain";
import type { SandboxResult } from "@/components/features/admin/provider-sandbox";

// ---------------------------------------------------------------------------
// API Response types (matching the backend response shapes)
// ---------------------------------------------------------------------------

type AIProviderRow = Tables<"ai_providers">;

interface CostTotals {
  cost: number;
  tokens_input: number;
  tokens_output: number;
  requests: number;
}

interface CostByProvider {
  provider_id: string;
  provider_key: string;
  display_name: string;
  total_tokens_input: number;
  total_tokens_output: number;
  total_cost: number;
  request_count: number;
}

interface CostsResponse {
  period: string;
  start_date: string;
  end_date: string;
  totals: CostTotals;
  by_provider: CostByProvider[];
  by_feature: Array<{
    feature: string;
    total_tokens_input: number;
    total_tokens_output: number;
    total_cost: number;
    request_count: number;
  }>;
}

interface SystemPromptRow extends Tables<"system_prompts"> {
  total_versions: number;
}

type FeatureFlagRow = Tables<"feature_flags">;

interface ProviderTestResult {
  provider_key: string;
  display_name: string;
  available: boolean;
  latency_ms: number;
  error: string | null;
  tested_at: string;
}

type CostPeriod = "day" | "week" | "month";

// ---------------------------------------------------------------------------
// Provider icon/color mapping (display metadata not stored in DB)
// ---------------------------------------------------------------------------

const PROVIDER_DISPLAY_META: Record<
  string,
  { icon: string; iconBg: string }
> = {
  gemini: { icon: "\u2728", iconBg: "#E8F5E9" },
  claude: { icon: "\uD83D\uDFE0", iconBg: "#FFF3E0" },
  openai: { icon: "\uD83D\uDCAC", iconBg: "#E3F2FD" },
  copilot: { icon: "\uD83D\uDD37", iconBg: "#F3E5F5" },
  groq: { icon: "\u26A1", iconBg: "#FFF8E1" },
  mistral: { icon: "\uD83C\uDF0A", iconBg: "#E0F2F1" },
};

const DEFAULT_ICON = { icon: "\uD83E\uDD16", iconBg: "#F5F5F5" };

// ---------------------------------------------------------------------------
// Helper: typed fetch wrapper
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    const json: ApiResponse<T> = await res.json();

    if (!res.ok || json.error) {
      return {
        data: null,
        error: json.error?.message ?? `Fehler ${res.status}: ${res.statusText}`,
      };
    }

    return { data: json.data, error: null };
  } catch {
    return { data: null, error: "Netzwerkfehler. Bitte Verbindung pruefen." };
  }
}

// ---------------------------------------------------------------------------
// Mapper functions: DB rows -> UI component props
// ---------------------------------------------------------------------------

function mapProviderToCard(p: AIProviderRow, allProviders: AIProviderRow[]): ProviderData {
  const meta = PROVIDER_DISPLAY_META[p.provider_key] ?? DEFAULT_ICON;
  const isActive = p.is_active;
  const isPrimary = p.is_primary;

  // Determine fallback order based on position among non-primary active providers
  let fallbackOrder: number | undefined;
  if (isActive && !isPrimary) {
    const activeFallbacks = allProviders
      .filter((prov) => prov.is_active && !prov.is_primary)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const idx = activeFallbacks.findIndex((fb) => fb.id === p.id);
    if (idx >= 0) fallbackOrder = idx + 1;
  }

  let status: ProviderStatus;
  let statusLabel: string;

  if (isPrimary) {
    status = "primary";
    statusLabel = "Primaer";
  } else if (isActive) {
    status = "fallback";
    statusLabel = fallbackOrder ? `Fallback ${fallbackOrder}` : "Fallback";
  } else {
    status = "inactive";
    statusLabel = "Nicht konfiguriert";
  }

  return {
    id: p.id,
    name: p.display_name,
    icon: meta.icon,
    iconBg: meta.iconBg,
    endpoint: p.api_endpoint,
    model: p.model,
    apiKeyMasked: p.api_key_encrypted ?? "Nicht hinterlegt",
    temperature: p.temperature,
    costPerMonth: p.monthly_budget_limit
      ? `\u20AC ${p.monthly_budget_limit.toFixed(2).replace(".", ",")}`
      : undefined,
    status,
    statusLabel,
    fallbackOrder,
  };
}

function mapProviderToChain(p: AIProviderRow, allProviders: AIProviderRow[]): ChainItem {
  const card = mapProviderToCard(p, allProviders);
  return {
    id: card.id,
    name: card.name,
    icon: card.icon,
    role: card.status === "primary" ? "primary" : card.status === "fallback" ? "fallback" : "inactive",
    label: card.statusLabel,
  };
}

function formatCurrency(value: number): string {
  return `\u20AC ${value.toFixed(2).replace(".", ",")}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M Tokens`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K Tokens`;
  return `${n} Tokens`;
}

function mapCostsToItems(data: CostsResponse): CostItem[] {
  const items: CostItem[] = [
    {
      id: "total",
      label: "Gesamt-Kosten",
      amount: formatCurrency(data.totals.cost),
      subInfo: `${data.totals.requests} Anfragen | ${formatTokens(data.totals.tokens_input + data.totals.tokens_output)}`,
      color: "text-surface-900",
    },
  ];

  const colorMap: Record<string, string> = {
    gemini: "text-brand-primary-500",
    claude: "text-amber-500",
    openai: "text-blue-500",
    copilot: "text-purple-500",
    groq: "text-yellow-500",
    mistral: "text-teal-500",
  };

  for (const bp of data.by_provider) {
    items.push({
      id: bp.provider_id,
      label: bp.display_name,
      amount: formatCurrency(bp.total_cost),
      subInfo: `${formatTokens(bp.total_tokens_input + bp.total_tokens_output)} (${bp.request_count} Anfragen)`,
      color: colorMap[bp.provider_key] ?? "text-surface-400",
    });
  }

  return items;
}

function mapPromptToItem(p: SystemPromptRow): SystemPromptItem {
  return {
    id: p.prompt_key,
    name: p.prompt_key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    description: p.prompt_text.slice(0, 80) + (p.prompt_text.length > 80 ? "..." : ""),
    version: `v${p.total_versions}`,
  };
}

function mapFeatureToItem(f: FeatureFlagRow): FeatureToggleItem {
  return {
    id: f.id,
    name: f.name,
    description: f.description,
    enabled: f.enabled,
  };
}

// ---------------------------------------------------------------------------
// Period display label
// ---------------------------------------------------------------------------

function periodLabel(period: CostPeriod): string {
  const now = new Date();
  switch (period) {
    case "day": {
      return now.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
    }
    case "week": {
      return "Letzte 7 Tage";
    }
    case "month": {
      return now.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    }
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface AdminDataState {
  // --- Providers ---
  providers: ProviderData[];
  providerRows: AIProviderRow[];
  chainItems: ChainItem[];
  providersLoading: boolean;
  providersError: string | null;

  // --- Costs ---
  costItems: CostItem[];
  costPeriod: CostPeriod;
  costPeriodLabel: string;
  costsLoading: boolean;
  costsError: string | null;

  // --- Prompts ---
  prompts: SystemPromptItem[];
  promptsLoading: boolean;
  promptsError: string | null;

  // --- Features ---
  features: FeatureToggleItem[];
  featuresLoading: boolean;
  featuresError: string | null;

  // --- Sandbox ---
  sandboxResults: SandboxResult[];
  sandboxLoading: boolean;
  sandboxError: string | null;

  // --- Global ---
  globalError: string | null;

  // --- Actions ---
  fetchProviders: () => Promise<void>;
  fetchCosts: (period?: CostPeriod) => Promise<void>;
  fetchPrompts: () => Promise<void>;
  fetchFeatures: () => Promise<void>;
  setCostPeriod: (period: CostPeriod) => void;

  updateProvider: (id: string, updates: Record<string, unknown>) => Promise<boolean>;
  setProviderPrimary: (id: string) => Promise<boolean>;
  testProvider: (id: string) => Promise<ProviderTestResult | null>;
  testAllProviders: (prompt: string) => Promise<void>;
  updatePrompt: (promptKey: string, promptText: string) => Promise<boolean>;
  toggleFeature: (id: string, enabled: boolean) => Promise<boolean>;
  dismissError: () => void;
}

export function useAdminData(): AdminDataState {
  // --- Providers ---
  const [providerRows, setProviderRows] = useState<AIProviderRow[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

  // --- Costs ---
  const [costItems, setCostItems] = useState<CostItem[]>([]);
  const [costPeriod, setCostPeriodState] = useState<CostPeriod>("month");
  const [costsLoading, setCostsLoading] = useState(true);
  const [costsError, setCostsError] = useState<string | null>(null);

  // --- Prompts ---
  const [promptRows, setPromptRows] = useState<SystemPromptRow[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(true);
  const [promptsError, setPromptsError] = useState<string | null>(null);

  // --- Features ---
  const [featureRows, setFeatureRows] = useState<FeatureFlagRow[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [featuresError, setFeaturesError] = useState<string | null>(null);

  // --- Sandbox ---
  const [sandboxResults, setSandboxResults] = useState<SandboxResult[]>([]);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState<string | null>(null);

  // --- Global ---
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Track mounted state to avoid state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch: Providers
  // ---------------------------------------------------------------------------

  const fetchProviders = useCallback(async () => {
    setProvidersLoading(true);
    setProvidersError(null);

    const { data, error } = await apiFetch<AIProviderRow[]>("/api/admin/providers");

    if (!mountedRef.current) return;

    if (error) {
      setProvidersError(error);
      setProvidersLoading(false);
      return;
    }

    setProviderRows(data ?? []);
    setProvidersLoading(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch: Costs
  // ---------------------------------------------------------------------------

  const fetchCosts = useCallback(async (period: CostPeriod = costPeriod) => {
    setCostsLoading(true);
    setCostsError(null);

    const { data, error } = await apiFetch<CostsResponse>(
      `/api/admin/costs?period=${period}`,
    );

    if (!mountedRef.current) return;

    if (error) {
      setCostsError(error);
      setCostsLoading(false);
      return;
    }

    if (data) {
      setCostItems(mapCostsToItems(data));
    }
    setCostsLoading(false);
  }, [costPeriod]);

  // ---------------------------------------------------------------------------
  // Fetch: Prompts
  // ---------------------------------------------------------------------------

  const fetchPrompts = useCallback(async () => {
    setPromptsLoading(true);
    setPromptsError(null);

    const { data, error } = await apiFetch<SystemPromptRow[]>("/api/admin/prompts");

    if (!mountedRef.current) return;

    if (error) {
      setPromptsError(error);
      setPromptsLoading(false);
      return;
    }

    setPromptRows(data ?? []);
    setPromptsLoading(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch: Features
  // ---------------------------------------------------------------------------

  const fetchFeatures = useCallback(async () => {
    setFeaturesLoading(true);
    setFeaturesError(null);

    const { data, error } = await apiFetch<FeatureFlagRow[]>("/api/admin/features");

    if (!mountedRef.current) return;

    if (error) {
      setFeaturesError(error);
      setFeaturesLoading(false);
      return;
    }

    setFeatureRows(data ?? []);
    setFeaturesLoading(false);
  }, []);

  // ---------------------------------------------------------------------------
  // Mutation: Update Provider
  // ---------------------------------------------------------------------------

  const updateProvider = useCallback(
    async (id: string, updates: Record<string, unknown>): Promise<boolean> => {
      const { error } = await apiFetch<AIProviderRow>("/api/admin/providers", {
        method: "PUT",
        body: JSON.stringify({ id, ...updates }),
      });

      if (error) {
        setGlobalError(`Provider-Update fehlgeschlagen: ${error}`);
        return false;
      }

      await fetchProviders();
      return true;
    },
    [fetchProviders],
  );

  // ---------------------------------------------------------------------------
  // Mutation: Set Provider as Primary
  // ---------------------------------------------------------------------------

  const setProviderPrimary = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await apiFetch<AIProviderRow>("/api/admin/providers", {
        method: "PUT",
        body: JSON.stringify({ id, is_primary: true, is_active: true }),
      });

      if (error) {
        setGlobalError(`Primaer-Provider setzen fehlgeschlagen: ${error}`);
        return false;
      }

      await fetchProviders();
      return true;
    },
    [fetchProviders],
  );

  // ---------------------------------------------------------------------------
  // Mutation: Test Provider
  // ---------------------------------------------------------------------------

  const testProvider = useCallback(
    async (id: string): Promise<ProviderTestResult | null> => {
      const { data, error } = await apiFetch<ProviderTestResult>(
        "/api/admin/providers/test",
        {
          method: "POST",
          body: JSON.stringify({ id }),
        },
      );

      if (error) {
        setGlobalError(`Provider-Test fehlgeschlagen: ${error}`);
        return null;
      }

      return data;
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Mutation: Test All Providers (Sandbox)
  // ---------------------------------------------------------------------------

  const testAllProviders = useCallback(
    async (_prompt: string) => {
      setSandboxLoading(true);
      setSandboxError(null);

      const results: SandboxResult[] = [];

      for (const row of providerRows) {
        const meta = PROVIDER_DISPLAY_META[row.provider_key] ?? DEFAULT_ICON;

        if (!row.is_active) {
          results.push({
            id: row.id,
            providerName: `${row.display_name} (${row.model})`,
            providerIcon: meta.icon,
            response: "Provider nicht konfiguriert. Bitte API-Key und Endpoint hinterlegen.",
            latency: "",
            tokens: "",
            cost: "",
            available: false,
          });
          continue;
        }

        const testResult = await testProvider(row.id);

        results.push({
          id: row.id,
          providerName: `${row.display_name} (${row.model})`,
          providerIcon: meta.icon,
          response: testResult?.available
            ? `Provider erreichbar (${testResult.latency_ms}ms Latenz)`
            : testResult?.error ?? "Provider nicht erreichbar",
          latency: testResult?.latency_ms ? `${testResult.latency_ms}ms` : "",
          tokens: "",
          cost: "",
          available: testResult?.available ?? false,
        });
      }

      if (!mountedRef.current) return;

      setSandboxResults(results);
      setSandboxLoading(false);
    },
    [providerRows, testProvider],
  );

  // ---------------------------------------------------------------------------
  // Mutation: Update Prompt
  // ---------------------------------------------------------------------------

  const updatePrompt = useCallback(
    async (promptKey: string, promptText: string): Promise<boolean> => {
      const { error } = await apiFetch<unknown>("/api/admin/prompts", {
        method: "PUT",
        body: JSON.stringify({ prompt_key: promptKey, prompt_text: promptText }),
      });

      if (error) {
        setGlobalError(`Prompt-Update fehlgeschlagen: ${error}`);
        return false;
      }

      await fetchPrompts();
      return true;
    },
    [fetchPrompts],
  );

  // ---------------------------------------------------------------------------
  // Mutation: Toggle Feature
  // ---------------------------------------------------------------------------

  const toggleFeature = useCallback(
    async (id: string, enabled: boolean): Promise<boolean> => {
      const { error } = await apiFetch<FeatureFlagRow>("/api/admin/features", {
        method: "PUT",
        body: JSON.stringify({ id, enabled }),
      });

      if (error) {
        setGlobalError(`Feature-Toggle fehlgeschlagen: ${error}`);
        return false;
      }

      await fetchFeatures();
      return true;
    },
    [fetchFeatures],
  );

  // ---------------------------------------------------------------------------
  // Cost Period Setter (triggers refetch)
  // ---------------------------------------------------------------------------

  const setCostPeriod = useCallback(
    (period: CostPeriod) => {
      setCostPeriodState(period);
      fetchCosts(period);
    },
    [fetchCosts],
  );

  // ---------------------------------------------------------------------------
  // Dismiss global error
  // ---------------------------------------------------------------------------

  const dismissError = useCallback(() => {
    setGlobalError(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Initial data load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchProviders();
    fetchCosts();
    fetchPrompts();
    fetchFeatures();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Derived data (map DB rows to UI types)
  // ---------------------------------------------------------------------------

  const providers = providerRows.map((p) => mapProviderToCard(p, providerRows));
  const chainItems = providerRows
    .filter((p) => p.is_active || p.is_primary)
    .map((p) => mapProviderToChain(p, providerRows))
    .concat(
      providerRows
        .filter((p) => !p.is_active && !p.is_primary)
        .map((p) => mapProviderToChain(p, providerRows)),
    );

  const prompts = promptRows.map(mapPromptToItem);
  const features = featureRows.map(mapFeatureToItem);

  return {
    // Providers
    providers,
    providerRows,
    chainItems,
    providersLoading,
    providersError,

    // Costs
    costItems,
    costPeriod,
    costPeriodLabel: periodLabel(costPeriod),
    costsLoading,
    costsError,

    // Prompts
    prompts,
    promptsLoading,
    promptsError,

    // Features
    features,
    featuresLoading,
    featuresError,

    // Sandbox
    sandboxResults,
    sandboxLoading,
    sandboxError,

    // Global
    globalError,

    // Actions
    fetchProviders,
    fetchCosts,
    fetchPrompts,
    fetchFeatures,
    setCostPeriod,
    updateProvider,
    setProviderPrimary,
    testProvider,
    testAllProviders,
    updatePrompt,
    toggleFeature,
    dismissError,
  };
}
