// =============================================================================
// Unit Tests: src/lib/search/hybrid-search.ts (ADR-014)
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: vi.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { hybridSearchBestPractices } from '@/lib/search/hybrid-search';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Baut einen Supabase-Admin-Mock mit konfigurierbarem RPC-Ergebnis. */
function makeAdminMock(rpcResult: { data: unknown; error: unknown }) {
  return {
    rpc: vi.fn().mockResolvedValue(rpcResult),
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- test helper cast
type AdminMock = ReturnType<typeof makeAdminMock>;
function asAdminClient(mock: AdminMock): ReturnType<typeof createAdminClient> {
  return mock as unknown as SupabaseClient as ReturnType<typeof createAdminClient>;
}

const MOCK_EMBEDDING = new Array<number>(1536).fill(0.1);

const MOCK_RPC_ROWS = [
  { id: 'bp-1', title: 'Prompt Engineering Best Practices', content: 'Use clear instructions...', score: 0.025 },
  { id: 'bp-2', title: 'AI Tool Selection Guide', content: 'When choosing an AI tool...', score: 0.018 },
];

// ---------------------------------------------------------------------------
// RRF-Score-Berechnung
// ---------------------------------------------------------------------------

describe('hybridSearchBestPractices — RRF score ordering', () => {
  beforeEach(() => {
    vi.mocked(generateEmbedding).mockResolvedValue(MOCK_EMBEDDING);
    vi.mocked(createAdminClient).mockReturnValue(
      asAdminClient(makeAdminMock({ data: MOCK_RPC_ROWS, error: null })),
    );
  });

  it('gibt Ergebnisse sortiert nach score DESC zurueck', async () => {
    const results = await hybridSearchBestPractices({ query: 'prompt engineering', topK: 10 });

    expect(results).toHaveLength(2);
    expect(results[0]?.score).toBeGreaterThanOrEqual(results[1]?.score ?? 0);
  });

  it('mappt id, title, content und score korrekt', async () => {
    const results = await hybridSearchBestPractices({ query: 'AI tools', topK: 10 });

    expect(results[0]).toEqual({
      id: 'bp-1',
      title: 'Prompt Engineering Best Practices',
      content: 'Use clear instructions...',
      score: 0.025,
    });
  });

  it('ruft hybrid_search_best_practices RPC mit korrekten Parametern auf', async () => {
    const adminMock = makeAdminMock({ data: [], error: null });
    vi.mocked(createAdminClient).mockReturnValue(asAdminClient(adminMock));

    await hybridSearchBestPractices(
      { query: 'semantic search', topK: 5, weights: { fullTextWeight: 0.5, semanticWeight: 1.5, rrfK: 40 } },
    );

    expect(adminMock.rpc).toHaveBeenCalledWith(
      'hybrid_search_best_practices',
      expect.objectContaining({
        query_text: 'semantic search',
        match_count: 5,
        full_text_weight: 0.5,
        semantic_weight: 1.5,
        rrf_k: 40,
      }),
    );
  });

  it('begrenzt topK auf maximal 30', async () => {
    const adminMock = makeAdminMock({ data: [], error: null });
    vi.mocked(createAdminClient).mockReturnValue(asAdminClient(adminMock));

    await hybridSearchBestPractices({ query: 'test', topK: 999 });

    expect(adminMock.rpc).toHaveBeenCalledWith(
      'hybrid_search_best_practices',
      expect.objectContaining({ match_count: 30 }),
    );
  });
});

// ---------------------------------------------------------------------------
// Embedding-Fehler → Full-Text-Only-Fallback (semantic_weight=0)
// ---------------------------------------------------------------------------

describe('hybridSearchBestPractices — Embedding-Fehler Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('setzt semantic_weight=0 wenn Embedding-Generierung fehlschlaegt', async () => {
    vi.mocked(generateEmbedding).mockRejectedValue(new Error('OpenAI API error (429)'));

    const adminMock = makeAdminMock({ data: [], error: null });
    vi.mocked(createAdminClient).mockReturnValue(asAdminClient(adminMock));

    // Kein Fehler geworfen — Fallback laeuft durch
    const results = await hybridSearchBestPractices({ query: 'test fallback', topK: 5 });

    expect(results).toEqual([]);
    expect(adminMock.rpc).toHaveBeenCalledWith(
      'hybrid_search_best_practices',
      expect.objectContaining({ semantic_weight: 0 }),
    );
  });

  it('nutzt vorberechnetes Embedding wenn angegeben (kein generateEmbedding-Aufruf)', async () => {
    const precomputedEmbedding = new Array<number>(1536).fill(0.5);
    const adminMock = makeAdminMock({ data: MOCK_RPC_ROWS, error: null });
    vi.mocked(createAdminClient).mockReturnValue(asAdminClient(adminMock));

    await hybridSearchBestPractices({
      query: 'pre-embedded query',
      topK: 5,
      embedding: precomputedEmbedding,
    });

    expect(generateEmbedding).not.toHaveBeenCalled();
    expect(adminMock.rpc).toHaveBeenCalledWith(
      'hybrid_search_best_practices',
      expect.objectContaining({ semantic_weight: 1.0 }),
    );
  });
});

// ---------------------------------------------------------------------------
// Empty-Query-Schutz
// ---------------------------------------------------------------------------

describe('hybridSearchBestPractices — Empty-Query-Schutz', () => {
  it('gibt leeres Array zurueck ohne RPC-Aufruf bei leerem query', async () => {
    const adminMock = makeAdminMock({ data: [], error: null });
    vi.mocked(createAdminClient).mockReturnValue(asAdminClient(adminMock));

    const results = await hybridSearchBestPractices({ query: '', topK: 10 });

    expect(results).toEqual([]);
    expect(adminMock.rpc).not.toHaveBeenCalled();
  });

  it('gibt leeres Array zurueck bei whitespace-only query', async () => {
    const adminMock = makeAdminMock({ data: [], error: null });
    vi.mocked(createAdminClient).mockReturnValue(asAdminClient(adminMock));

    const results = await hybridSearchBestPractices({ query: '   ', topK: 10 });

    expect(results).toEqual([]);
    expect(adminMock.rpc).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// RPC-Fehler
// ---------------------------------------------------------------------------

describe('hybridSearchBestPractices — RPC-Fehler', () => {
  it('wirft einen Fehler wenn der RPC-Call fehlschlaegt', async () => {
    vi.mocked(generateEmbedding).mockResolvedValue(MOCK_EMBEDDING);
    vi.mocked(createAdminClient).mockReturnValue(
      asAdminClient(makeAdminMock({ data: null, error: { message: 'function does not exist' } })),
    );

    await expect(
      hybridSearchBestPractices({ query: 'failing query', topK: 5 }),
    ).rejects.toThrow('[hybrid-search] RPC failed');
  });
});

// ---------------------------------------------------------------------------
// Telemetrie (fire-and-forget — kein Fehler bei Insert-Fehler)
// ---------------------------------------------------------------------------

describe('hybridSearchBestPractices — Telemetrie', () => {
  it('wirft keinen Fehler wenn Telemetrie-Insert fehlschlaegt', async () => {
    vi.mocked(generateEmbedding).mockResolvedValue(MOCK_EMBEDDING);

    // RPC-Mock erfolgreich, aber from().insert() schlaegt fehl
    const adminMock = {
      rpc: vi.fn().mockResolvedValue({ data: MOCK_RPC_ROWS, error: null }),
      from: vi.fn(() => ({
        insert: vi.fn().mockRejectedValue(new Error('DB connection lost')),
      })),
    };
    vi.mocked(createAdminClient).mockReturnValue(
      adminMock as unknown as SupabaseClient as ReturnType<typeof createAdminClient>,
    );

    // Kein Fehler erwartet — Telemetrie ist fire-and-forget
    const results = await hybridSearchBestPractices({ query: 'test telemetry', topK: 5 });
    expect(results).toHaveLength(2);
  });
});
