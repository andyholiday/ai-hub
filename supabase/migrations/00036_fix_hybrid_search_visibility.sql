-- =============================================================================
-- AI Hub - Fix Hybrid Search Visibility (Security Fix)
-- Version: 00036
-- Date: 2026-05-22
-- Description: Closes content-leak in hybrid_search_best_practices.
--   The function was called via service-role admin client, bypassing RLS and
--   returning unpublished rows to any authenticated caller.
--   Fix: add caller_id parameter; filter rows to published-only OR owned by caller.
--   Mirrors the visibility rule in the best_practices_select_published RLS policy
--   and the match_best_practices RPC (00003_semantic_search.sql).
--
--   community_posts has no status column and its RLS policy is USING (true) for
--   all authenticated users, so no visibility change is needed there.
-- =============================================================================

-- Drop the old 6-arg overload from 00021 that lacks the caller_id visibility
-- filter. Without this DROP, both signatures coexist and callers can still
-- invoke the unsafe version directly, bypassing the new filter.
DROP FUNCTION IF EXISTS hybrid_search_best_practices(text, vector(1536), int, float, float, int);

CREATE OR REPLACE FUNCTION hybrid_search_best_practices(
  query_text text,
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  full_text_weight float DEFAULT 1.0,
  semantic_weight float DEFAULT 1.0,
  rrf_k int DEFAULT 60,
  caller_id uuid DEFAULT NULL
)
RETURNS TABLE (id uuid, title text, content text, score float)
LANGUAGE sql STABLE PARALLEL SAFE
SET search_path = public, extensions
AS $$
  WITH full_text AS (
    SELECT bp.id,
           row_number() OVER (
             ORDER BY ts_rank_cd(bp.search_vector, websearch_to_tsquery('german', query_text)) DESC
           ) AS rank_ix
    FROM best_practices bp
    WHERE bp.search_vector @@ websearch_to_tsquery('german', query_text)
      AND (bp.status = 'published' OR bp.author_id = caller_id)
    LIMIT LEAST(match_count, 30) * 2
  ),
  semantic AS (
    SELECT bp.id,
           row_number() OVER (
             ORDER BY bp.embedding <=> query_embedding
           ) AS rank_ix
    FROM best_practices bp
    WHERE bp.embedding IS NOT NULL
      AND (bp.status = 'published' OR bp.author_id = caller_id)
    LIMIT LEAST(match_count, 30) * 2
  )
  SELECT
    bp.id,
    bp.title,
    bp.content,
    (
      coalesce(1.0 / (rrf_k + ft.rank_ix), 0.0) * full_text_weight +
      coalesce(1.0 / (rrf_k + s.rank_ix), 0.0) * semantic_weight
    )::float AS score
  FROM best_practices bp
  LEFT JOIN full_text ft ON ft.id = bp.id
  LEFT JOIN semantic s ON s.id = bp.id
  WHERE (ft.id IS NOT NULL OR s.id IS NOT NULL)
    AND (bp.status = 'published' OR bp.author_id = caller_id)
  ORDER BY score DESC
  LIMIT LEAST(match_count, 30);
$$;

COMMENT ON FUNCTION hybrid_search_best_practices IS
  'Hybrid Search fuer best_practices: RRF-Fusion aus tsvector-Full-Text (GIN) '
  'und pgvector-Semantic-Search (HNSW). ADR-014. '
  'caller_id filters results to published rows plus rows owned by the caller, '
  'mirroring the best_practices_select_published RLS policy. '
  'Pass auth.uid() (or the authenticated user UUID) as caller_id from the application layer.';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
