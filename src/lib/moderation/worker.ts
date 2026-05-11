// =============================================================================
// Moderation Worker — ONNX Spike (Pattern P1.3)
//
// Decision: Single-threaded (no Web Worker) for the spike.
//
// Rationale: The spike goal is to measure model accuracy + latency, not
// to optimise thread scheduling. A Web Worker would require a separate
// webpack entry point, Next.js worker config, and cross-origin URL setup —
// all overhead that obscures the core signal. For a production build
// (if the spike receives GO), a dedicated Worker with Comlink is the right
// path and should be documented in ADR-015.
//
// This module re-exports the classifier so consumers have a single import
// point that can later be swapped out for a Worker-backed adapter.
// =============================================================================

export { classifyToxicity, getModelState } from './browser-classifier';
export type { ToxicityScore, ModerationResult, ModelInitState } from './types';
