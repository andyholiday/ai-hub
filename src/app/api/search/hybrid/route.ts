// =============================================================================
// Hybrid Search API — POST /api/search/hybrid (ADR-014)
// BM25-aequivalent (tsvector) + Semantic (pgvector), RRF-Fusion in Postgres.
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api/require-auth';
import { rateLimit, rateLimitHeaders } from '@/lib/api/rate-limit';
import {
  apiSuccess,
  apiError,
  apiValidationError,
  apiInternalError,
} from '@/lib/api/response';
import { getFeature } from '@/lib/features/feature-registry';
import { hybridSearchBestPractices } from '@/lib/search/hybrid-search';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Zod-Schema
// ---------------------------------------------------------------------------

const hybridSearchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(2000, 'Search query must be <= 2000 characters'),
  topK: z
    .number()
    .int('topK must be an integer')
    .min(1, 'topK must be >= 1')
    .max(30, 'topK must be <= 30')
    .default(10),
  weights: z
    .object({
      fullTextWeight: z.number().min(0).max(10).optional(),
      semanticWeight: z.number().min(0).max(10).optional(),
      rrfK: z.number().int().min(1).max(200).optional(),
    })
    .optional(),
});

type HybridSearchBody = z.infer<typeof hybridSearchSchema>;

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  // --- Auth ---
  const auth = await requireAuth(req);
  if ('response' in auth) return auth.response;
  const { userId } = auth;

  // --- Rate Limit ---
  const rl = await rateLimit(req, 'search', userId);
  if (!rl.success) {
    return NextResponse.json(
      {
        data: null,
        error: { code: 'RATE_LIMITED', message: 'Rate limit exceeded. Please try again later.' },
      },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  // --- Feature-Flag-Guard ---
  const feature = getFeature('hybrid-search');
  if (!feature.defaultEnabled) {
    // TODO(Wave-3, P2.2): user/org-Prefs aus user_feature_prefs pruefen statt nur defaultEnabled
    // Aktuell: POC-Verhalten — Feature global aus, opt-in via Wave-3-Settings-UX
    return apiError(
      'FEATURE_DISABLED',
      'Hybrid search is not enabled. Enable the "hybrid-search" feature to use this endpoint.',
      403,
    );
  }

  // --- Body-Validierung ---
  const raw: unknown = await req.json().catch(() => null);
  if (raw === null) {
    return apiError('BAD_REQUEST', 'Invalid JSON body', 400);
  }

  const parsed = hybridSearchSchema.safeParse(raw);
  if (!parsed.success) {
    return apiValidationError(parsed.error);
  }

  const body: HybridSearchBody = parsed.data;

  // --- Hybrid Search ---
  try {
    const results = await hybridSearchBestPractices(
      {
        query: body.query,
        topK: body.topK,
        weights: body.weights,
      },
      userId,
    );

    return apiSuccess({
      results,
      meta: {
        query: body.query,
        totalResults: results.length,
        topK: body.topK,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Hybrid search failed';
    return apiInternalError(message);
  }
}
