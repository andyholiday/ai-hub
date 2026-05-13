// =============================================================================
// Integration Test: POST /api/search/hybrid — Happy Path (200)
//
// Separate Datei, damit vi.mock() hoisted ist und das Modul-Caching (Vitest)
// nicht den Feature-Registry-Mock aus hybrid.test.ts ueberschreibt.
// Dieser Test beweist den 200-Pfad wenn hybrid-search aktiviert ist.
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks — muessen vor den Importen der Route stehen (Vitest hoistet vi.mock)
// ---------------------------------------------------------------------------

vi.mock('@/lib/api/require-auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/api/rate-limit', () => ({
  rateLimit: vi.fn(),
  rateLimitHeaders: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/search/hybrid-search', () => ({
  hybridSearchBestPractices: vi.fn(),
}));

// Feature-Registry mocken: hybrid-search defaultEnabled=true
vi.mock('@/lib/features/feature-registry', () => ({
  getFeature: vi.fn().mockReturnValue({
    id: 'hybrid-search',
    defaultEnabled: true,
    userToggleable: true,
    orgToggleable: true,
    deps: [],
    toggleStrategy: 'block',
  }),
  FEATURE_REGISTRY: [],
  validateRegistry: vi.fn(),
}));

import { requireAuth } from '@/lib/api/require-auth';
import { rateLimit } from '@/lib/api/rate-limit';
import { hybridSearchBestPractices } from '@/lib/search/hybrid-search';
import { POST } from '@/app/api/search/hybrid/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/search/hybrid', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const MOCK_AUTH_SUCCESS = {
  userId: 'user-123',
  role: 'user' as const,
  supabase: {} as ReturnType<typeof import('@supabase/ssr').createServerClient>,
};

const MOCK_RATE_LIMIT_OK = {
  success: true,
  limit: 30,
  remaining: 29,
  reset: Date.now() + 60_000,
};

const MOCK_RESULTS = [
  { id: 'bp-1', title: 'Hybrid Search Best Practice', content: 'Content', score: 0.95 },
  { id: 'bp-2', title: 'Postgres Full-Text', content: 'More content', score: 0.87 },
];

// ---------------------------------------------------------------------------
// Happy Path — Feature aktiv → 200
// ---------------------------------------------------------------------------

describe('POST /api/search/hybrid — Happy Path (Feature aktiv)', () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockResolvedValue(MOCK_AUTH_SUCCESS);
    vi.mocked(rateLimit).mockResolvedValue(MOCK_RATE_LIMIT_OK);
    vi.mocked(hybridSearchBestPractices).mockResolvedValue(MOCK_RESULTS);
  });

  it('gibt 200 zurueck wenn Feature aktiv und Query valide', async () => {
    const res = await POST(makeRequest({ query: 'semantic search postgres', topK: 5 }));
    expect(res.status).toBe(200);
  });

  it('Result-Array ist nicht leer und enthaelt Mock-Daten', async () => {
    const res = await POST(makeRequest({ query: 'semantic search postgres', topK: 5 }));
    const json = await res.json() as { data: { results: typeof MOCK_RESULTS } };
    expect(json.data.results).toHaveLength(2);
    const first = json.data.results.at(0);
    expect(first?.id).toBe('bp-1');
  });

  it('hybridSearchBestPractices wird mit korrekten Parametern aufgerufen', async () => {
    await POST(makeRequest({ query: 'test query', topK: 3 }));
    expect(hybridSearchBestPractices).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'test query', topK: 3 }),
      'user-123',
    );
  });

  it('gibt 400 zurueck bei ungueltigem JSON-Body', async () => {
    const req = new NextRequest('http://localhost/api/search/hybrid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('gibt 400 zurueck bei leerem Query-String', async () => {
    const res = await POST(makeRequest({ query: '', topK: 5 }));
    expect(res.status).toBe(400);
  });
});
