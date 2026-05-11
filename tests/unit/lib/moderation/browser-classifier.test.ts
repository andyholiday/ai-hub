// =============================================================================
// Tests: browser-classifier (Browser-ONNX Spike P1.3)
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock @xenova/transformers before importing the module under test
// ---------------------------------------------------------------------------

const mockPipeline = vi.fn();

vi.mock('@xenova/transformers', () => ({
  pipeline: mockPipeline,
  env: {
    backends: {
      onnx: {
        wasm: { proxy: false },
      },
    },
  },
}));

// ---------------------------------------------------------------------------
// Reset module state between tests so singleton doesn't bleed across cases
// ---------------------------------------------------------------------------

async function freshClassifier() {
  vi.resetModules();
  // Re-apply mock after resetModules
  vi.doMock('@xenova/transformers', () => ({
    pipeline: mockPipeline,
    env: {
      backends: {
        onnx: {
          wasm: { proxy: false },
        },
      },
    },
  }));
  const mod = await import('@/lib/moderation/browser-classifier');
  return mod;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setupNavigator(opts: { gpu?: boolean }) {
  if (opts.gpu) {
    Object.defineProperty(globalThis.navigator, 'gpu', {
      value: {},
      configurable: true,
      writable: true,
    });
  } else {
    // Ensure 'gpu' is absent
    const desc = Object.getOwnPropertyDescriptor(globalThis.navigator, 'gpu');
    if (desc) {
      Object.defineProperty(globalThis.navigator, 'gpu', {
        value: undefined,
        configurable: true,
        writable: true,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('classifyToxicity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupNavigator({ gpu: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // toxic-bert (Detoxify) is multi-label sigmoid over 6 classes. There is NO
  // 'safe' label — harmless input still gets a class with near-zero score.
  // Decision is threshold-based (>= 0.5 → toxic, else safe).

  it('returns label safe when top score is below threshold', async () => {
    mockPipeline.mockResolvedValue(
      vi.fn().mockResolvedValue([{ label: 'toxic', score: 0.003 }])
    );

    const { classifyToxicity } = await freshClassifier();
    const result = await classifyToxicity('Have a great day!');

    expect(result.label).toBe('safe');
    expect(result.score).toBeCloseTo(0.003);
    expect(typeof result.latencyMs).toBe('number');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns label toxic when top score is at or above threshold', async () => {
    mockPipeline.mockResolvedValue(
      vi.fn().mockResolvedValue([{ label: 'toxic', score: 0.91 }])
    );

    const { classifyToxicity } = await freshClassifier();
    const result = await classifyToxicity('I hate everyone here!');

    expect(result.label).toBe('toxic');
    expect(result.score).toBeCloseTo(0.91);
  });

  it('picks the highest-score label when multiple labels are returned', async () => {
    mockPipeline.mockResolvedValue(
      vi.fn().mockResolvedValue([
        { label: 'obscene', score: 0.15 },
        { label: 'insult', score: 0.85 },
      ])
    );

    const { classifyToxicity } = await freshClassifier();
    const result = await classifyToxicity('Some ambiguous text');

    expect(result.label).toBe('toxic');
    expect(result.score).toBeCloseTo(0.85);
  });

  it('classifies as safe even when the top label name is a toxicity class but score is low', async () => {
    // Regression: real toxic-bert always returns one of 6 toxicity classes;
    // we must not look at the label name, only the score.
    mockPipeline.mockResolvedValue(
      vi.fn().mockResolvedValue([{ label: 'insult', score: 0.04 }])
    );

    const { classifyToxicity } = await freshClassifier();
    const result = await classifyToxicity('Looking forward to our meeting tomorrow.');

    expect(result.label).toBe('safe');
  });

  it('throws when model load fails (state becomes error)', async () => {
    mockPipeline.mockRejectedValue(new Error('ONNX load failed'));

    const { classifyToxicity } = await freshClassifier();

    await expect(classifyToxicity('test')).rejects.toThrow(
      '[browser-classifier] Model is not available (state: error)'
    );
  });
});

describe('getModelState', () => {
  it('starts as idle before any classification call', async () => {
    mockPipeline.mockResolvedValue(
      vi.fn().mockResolvedValue([{ label: 'non-toxic', score: 0.99 }])
    );

    const { getModelState } = await freshClassifier();
    expect(getModelState()).toBe('idle');
  });

  it('transitions to ready after successful classification', async () => {
    mockPipeline.mockResolvedValue(
      vi.fn().mockResolvedValue([{ label: 'non-toxic', score: 0.99 }])
    );

    const { classifyToxicity, getModelState } = await freshClassifier();
    await classifyToxicity('Hello');

    expect(getModelState()).toBe('ready');
  });

  it('transitions to error when model load fails', async () => {
    mockPipeline.mockRejectedValue(new Error('no model'));

    const { classifyToxicity, getModelState } = await freshClassifier();

    try {
      await classifyToxicity('test');
    } catch {
      // expected
    }

    expect(getModelState()).toBe('error');
  });
});

describe('WebGPU vs WASM branch', () => {
  it('does not crash when navigator.gpu is present (WebGPU path)', async () => {
    setupNavigator({ gpu: true });

    mockPipeline.mockResolvedValue(
      vi.fn().mockResolvedValue([{ label: 'toxic', score: 0.01 }])
    );

    const { classifyToxicity } = await freshClassifier();
    const result = await classifyToxicity('Hello');

    // Pipeline still called — no crash on WebGPU path
    expect(mockPipeline).toHaveBeenCalledWith(
      'text-classification',
      'Xenova/toxic-bert',
      { quantized: true }
    );
    expect(result.label).toBe('safe');
  });

  it('does not crash when navigator.gpu is absent (WASM path)', async () => {
    setupNavigator({ gpu: false });

    mockPipeline.mockResolvedValue(
      vi.fn().mockResolvedValue([{ label: 'toxic', score: 0.01 }])
    );

    const { classifyToxicity } = await freshClassifier();
    const result = await classifyToxicity('Hello');

    expect(mockPipeline).toHaveBeenCalledWith(
      'text-classification',
      'Xenova/toxic-bert',
      { quantized: true }
    );
    expect(result.label).toBe('safe');
  });
});
