// =============================================================================
// AI Pricing Layer
// Pure lookup functions over AI_MODELS from config.ts.
// Single Source of Truth for all provider cost calculations.
// =============================================================================

import type { AIProvider } from "./types";
import { AI_MODELS } from "./config";

// ---------------------------------------------------------------------------
// Pricing für Provider außerhalb des Standard-AIProvider-Union-Types
// ---------------------------------------------------------------------------

/**
 * Experiment-Tier free-tier; Production-Tier-Preise siehe https://mistral.ai/pricing
 * ADR-013: Mistral EU Privacy Provider (Experiment-Tier, 0€/Monat)
 */
const MISTRAL_EU_PRICING = {
  inputPer1k: 0,
  outputPer1k: 0,
} as const;

export interface TokenCost {
  /** Estimated cost in USD */
  estimatedCost: number;
  /** Input rate used (USD per 1k tokens) */
  inputRatePer1k: number;
  /** Output rate used (USD per 1k tokens) */
  outputRatePer1k: number;
}

/**
 * Returns the pricing rates for a provider + model combination.
 * Falls back to the first model of the provider when modelName is not found.
 * Returns { inputPer1k: 0, outputPer1k: 0 } for unknown providers (no throw).
 */
export function getPricingRates(
  provider: AIProvider | string,
  modelName: string,
): { inputPer1k: number; outputPer1k: number } {
  // ADR-013: Mistral EU Experiment-Tier ist immer 0€
  if (provider === "mistral-eu") {
    return { inputPer1k: MISTRAL_EU_PRICING.inputPer1k, outputPer1k: MISTRAL_EU_PRICING.outputPer1k };
  }

  const models = AI_MODELS[provider as AIProvider] ?? [];
  const model =
    models.find((m) => m.name === modelName || m.id === modelName) ??
    models[0];

  return {
    inputPer1k: model?.inputCostPer1k ?? 0,
    outputPer1k: model?.outputCostPer1k ?? 0,
  };
}

/**
 * Calculates the estimated cost for a completed request.
 * Returns estimatedCost: 0 when promptTokens and completionTokens are both 0
 * (e.g. streaming paths where individual token counts are not yet tracked —
 * streaming token counts: tracked in #issue-TBD).
 */
export function calculateCost(
  provider: AIProvider | string,
  modelName: string,
  usage: { promptTokens: number; completionTokens: number },
): TokenCost {
  const rates = getPricingRates(provider, modelName);
  const estimatedCost =
    (usage.promptTokens / 1000) * rates.inputPer1k +
    (usage.completionTokens / 1000) * rates.outputPer1k;

  return {
    estimatedCost: Math.round(estimatedCost * 1_000_000) / 1_000_000,
    inputRatePer1k: rates.inputPer1k,
    outputRatePer1k: rates.outputPer1k,
  };
}
