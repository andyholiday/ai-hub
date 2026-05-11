// =============================================================================
// Feature Registry — Public API
// Re-Export aller types und Funktionen aus types.ts und feature-registry.ts
// =============================================================================

export type { FeatureId, ToggleStrategy, FeatureConfig } from './types';
export { FEATURE_REGISTRY, getFeature, validateRegistry } from './feature-registry';
