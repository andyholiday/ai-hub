// =============================================================================
// Browser Classifier — ONNX Toxicity Spike (Pattern P1.3)
//
// Singleton lazy-init via @xenova/transformers.
// Uses WebGPU when available, WASM fallback otherwise.
// NO React imports — pure TS module.
// =============================================================================

import type { ToxicityScore, ModelInitState } from './types';

// ---------------------------------------------------------------------------
// Module-level singleton state
// ---------------------------------------------------------------------------

let classifier: ((text: string) => Promise<unknown>) | null = null;
let state: ModelInitState = 'idle';

/** Exposes current init state for React consumers. */
export function getModelState(): ModelInitState {
  return state;
}

// ---------------------------------------------------------------------------
// Lazy init
// ---------------------------------------------------------------------------

async function initClassifier(): Promise<void> {
  if (state === 'ready' || state === 'loading') return;
  state = 'loading';

  try {
    // Dynamic import to avoid SSR issues (this file is browser-only).
    const { pipeline, env } = await import('@xenova/transformers');

    // Force remote (HuggingFace) — don't try to fetch from /models/... on origin.
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    // Default: env.remoteHost = 'https://huggingface.co'
    // Default: env.remotePathTemplate = '{model}/resolve/{revision}'

    // WebGPU when available, WASM fallback.
    const device = 'gpu' in navigator ? 'webgpu' : 'wasm';

    // transformers.js v2 does not accept `device` in pipeline options
    // the same way v3 does — set it via env for WASM path.
    if (device !== 'webgpu') {
      env.backends.onnx.wasm.proxy = false;
    }

    const pipe = await pipeline(
      'text-classification',
      'Xenova/toxic-bert',
      { quantized: true }
    );

    // Narrow from PipelineType to callable.
    classifier = pipe as unknown as (text: string) => Promise<unknown>;
    state = 'ready';
  } catch (err) {
    state = 'error';
    console.error('[browser-classifier] Model load failed:', err);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

type RawClassificationResult = Array<{ label: string; score: number }>;

/**
 * Classifies a text string for toxicity.
 * Lazy-initializes the ONNX model on first call.
 * Throws if the model failed to load.
 */
export async function classifyToxicity(text: string): Promise<ToxicityScore> {
  if (state === 'idle') {
    await initClassifier();
  }

  // If still loading (concurrent callers), wait briefly via polling.
  if (state === 'loading') {
    await waitForReady();
  }

  if (state === 'error' || classifier === null) {
    throw new Error('[browser-classifier] Model is not available (state: error)');
  }

  const t0 = performance.now();
  const raw = (await classifier(text)) as RawClassificationResult;
  const latencyMs = Math.round(performance.now() - t0);

  // toxic-bert returns labels like 'toxic' / 'non-toxic' or 'LABEL_0'/'LABEL_1'.
  // We normalise: highest-score label wins, map to safe/toxic.
  const top = raw.reduce((a, b) => (a.score >= b.score ? a : b));
  const label = isToxicLabel(top.label) ? 'toxic' : 'safe';

  return { label, score: top.score, latencyMs };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isToxicLabel(label: string): boolean {
  const l = label.toLowerCase();
  // Xenova/toxic-bert uses 'toxic' directly; guard for LABEL_1 variants too.
  return l === 'toxic' || l === 'label_1';
}

/** Polls until model transitions out of 'loading', max 60 s. */
async function waitForReady(): Promise<void> {
  const deadline = Date.now() + 60_000;
  while (state === 'loading' && Date.now() < deadline) {
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
  }
}
