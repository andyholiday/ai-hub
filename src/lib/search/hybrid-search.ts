// =============================================================================
// Hybrid Search — Server-Side Module (ADR-014)
// BM25-aequivalent (tsvector) + pgvector Semantic Search, RRF-Fusion in SQL.
// =============================================================================

import { createAdminClient } from '@/lib/supabase/admin';
import { generateEmbedding } from '@/lib/ai/embeddings';
import type { HybridSearchInput, HybridSearchResult } from './types';

// ---------------------------------------------------------------------------
// Telemetrie (fire-and-forget)
// ---------------------------------------------------------------------------

/**
 * Schreibt einen ai_call_logs-Eintrag ohne den Such-Flow zu blockieren.
 * Fehler werden nur geloggt — nicht geworfen.
 */
async function logCall(
  userId: string | null,
  callType: 'hybrid' | 'skipped',
  provider: string | null,
): Promise<void> {
  try {
    const admin = createAdminClient();
    // ai_call_logs ist in Migration 00021 definiert aber noch nicht in den
    // generierten Typen (types.generated.ts) — daher `as never` Casts.
    await (admin.from as (t: string) => ReturnType<typeof admin.from>)('ai_call_logs')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not yet in generated types
      .insert({ user_id: userId, feature: 'search', call_type: callType, provider } as any);
  } catch (err) {
    console.warn('[hybrid-search] telemetry insert failed:', err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fuehrt eine Hybrid-Suche ueber best_practices aus.
 *
 * - Generiert ein Embedding fuer den query (OpenAI text-embedding-3-small).
 * - Bei Embedding-Fehler: Fallback auf reinen Full-Text (semantic_weight=0).
 * - Ruft die SQL-Funktion hybrid_search_best_practices via RPC auf.
 * - Loggt den Aufruf in ai_call_logs (fire-and-forget).
 *
 * @param input  Suchanfrage inkl. Konfiguration.
 * @param userId Optionale User-ID fuer Telemetrie-Logging.
 * @returns Sortierte Liste von HybridSearchResult (score DESC).
 */
export async function hybridSearchBestPractices(
  input: HybridSearchInput,
  userId: string | null = null,
): Promise<HybridSearchResult[]> {
  if (!input.query.trim()) {
    return [];
  }

  const topK = Math.min(Math.max(1, input.topK), 30);
  const fullTextWeight = input.weights?.fullTextWeight ?? 1.0;
  const rrfK = input.weights?.rrfK ?? 60;

  // --- Embedding generieren (mit Fallback) ---
  let embedding: number[];
  let semanticWeight: number;
  let provider: string | null;

  if (input.embedding && input.embedding.length === 1536) {
    // Vorberechnetes Embedding wurde uebergeben
    embedding = Array.from(input.embedding);
    semanticWeight = input.weights?.semanticWeight ?? 1.0;
    provider = 'provided';
  } else {
    try {
      embedding = await generateEmbedding(input.query);
      semanticWeight = input.weights?.semanticWeight ?? 1.0;
      provider = 'openai-embedding';
    } catch (err) {
      // Embedding-Fehler -> Full-Text-Only-Fallback
      console.warn('[hybrid-search] embedding failed, falling back to full-text only:', err instanceof Error ? err.message : err);
      // Null-Vektor als Platzhalter — semantic_weight=0 verhindert Nutzung im RRF
      embedding = new Array<number>(1536).fill(0);
      semanticWeight = 0;
      provider = null;
    }
  }

  // --- RPC-Call ---
  // caller_id is passed so the SQL function can enforce visibility:
  // only published rows OR rows owned by the caller are returned.
  // Without this, the service-role admin client bypasses RLS entirely.
  const admin = createAdminClient();
  const { data, error } = await admin.rpc(
    'hybrid_search_best_practices' as never,
    {
      query_text: input.query,
      query_embedding: `[${embedding.join(',')}]`,
      match_count: topK,
      full_text_weight: fullTextWeight,
      semantic_weight: semanticWeight,
      rrf_k: rrfK,
      caller_id: userId ?? null,
    } as never,
  );

  if (error) {
    throw new Error(`[hybrid-search] RPC failed: ${error.message}`);
  }

  const rows = (data ?? []) as Array<{
    id: string;
    title: string;
    content: string;
    score: number;
  }>;

  const results: HybridSearchResult[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    score: row.score,
  }));

  // Telemetrie fire-and-forget (nach dem RPC, blockiert nicht)
  void logCall(userId, 'hybrid', provider);

  return results;
}
