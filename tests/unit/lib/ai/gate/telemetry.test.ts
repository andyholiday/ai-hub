// =============================================================================
// Tests: Gate Telemetry
// =============================================================================

import { describe, it, expect, vi } from 'vitest';
import { logGateDecision } from '@/lib/ai/gate/telemetry';
import type { GateDecision, ComplexityScore } from '@/lib/ai/gate/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeComplexity(overrides: Partial<ComplexityScore> = {}): ComplexityScore {
  return {
    wordCount: 5,
    hasGenerationKeyword: false,
    hasEntities: false,
    cacheHit: false,
    durationMs: 0.3,
    ...overrides,
  };
}

function makeSupabaseMock(insertError: unknown = null) {
  const insertFn = vi.fn().mockResolvedValue({ error: insertError });
  const fromFn = vi.fn().mockReturnValue({ insert: insertFn });
  return { supabase: { from: fromFn } as unknown, insertFn, fromFn };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('logGateDecision — skipped decision', () => {
  it('inserts call_type=skipped for local route', async () => {
    const { supabase, insertFn } = makeSupabaseMock();
    const decision: GateDecision = { route: 'local', reason: 'short' };

    await logGateDecision(supabase as never, 'user-123', decision, makeComplexity(), 'ai-mentor-chat');
    // Fire-and-forget: give microtasks a tick to flush
    await new Promise((r) => setTimeout(r, 10));

    expect(insertFn).toHaveBeenCalledOnce();
    const call0 = insertFn.mock.calls[0];
    const payload = (call0 as [Record<string, unknown>])[0];
    expect(payload.call_type).toBe('skipped');
    expect(payload.feature).toBe('ai-mentor-chat');
    expect(payload.user_id).toBe('user-123');
    expect(payload.tokens_used).toBeNull();
  });

  it('inserts with null user_id when userId is null', async () => {
    const { supabase, insertFn } = makeSupabaseMock();
    const decision: GateDecision = { route: 'local', reason: 'cache-hit' };

    await logGateDecision(supabase as never, null, decision, makeComplexity(), 'test-feature');
    await new Promise((r) => setTimeout(r, 10));

    const call0 = insertFn.mock.calls[0];
    const payload = (call0 as [Record<string, unknown>])[0];
    expect(payload.user_id).toBeNull();
  });
});

describe('logGateDecision — llm decision', () => {
  it('inserts call_type=llm for llm route', async () => {
    const { supabase, insertFn } = makeSupabaseMock();
    const decision: GateDecision = { route: 'llm', reason: 'generation-keyword' };

    await logGateDecision(supabase as never, 'user-456', decision, makeComplexity(), 'ai-mentor-chat');
    await new Promise((r) => setTimeout(r, 10));

    expect(insertFn).toHaveBeenCalledOnce();
    const call0 = insertFn.mock.calls[0];
    const payload = (call0 as [Record<string, unknown>])[0];
    expect(payload.call_type).toBe('llm');
  });
});

describe('logGateDecision — error resilience', () => {
  it('does not throw when supabase insert returns an error', async () => {
    const { supabase } = makeSupabaseMock({ message: 'DB connection failed' });
    const decision: GateDecision = { route: 'local', reason: 'short' };

    // Must not throw
    await expect(
      logGateDecision(supabase as never, 'user-789', decision, makeComplexity(), 'test'),
    ).resolves.toBeUndefined();
  });

  it('does not throw when supabase.from throws synchronously', async () => {
    const brokenSupabase = {
      from: () => { throw new Error('supabase broken'); },
    };
    const decision: GateDecision = { route: 'llm', reason: 'fallback' };

    await expect(
      logGateDecision(brokenSupabase as never, null, decision, makeComplexity(), 'test'),
    ).resolves.toBeUndefined();
  });
});
