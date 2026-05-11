-- =============================================================================
-- AI Hub - Hybrid Search Setup (ADR-014)
-- Version: 00021
-- Date: 2026-05-07
-- Description: Implementiert Pattern P1.1 Postgres-Native Hybrid Search:
--   1. tsvector-Spalten + GIN-Index auf best_practices und community_posts
--   2. SQL-Funktionen hybrid_search_best_practices / hybrid_search_community_posts
--      (RRF-Fusion: Full-Text via tsvector + Semantic via pgvector)
--   3. ai_call_logs-Tabelle fuer Telemetrie-Tracking (LLM-Reduktion)
-- ADR: docs/architecture/adr/ADR-014-postgres-native-hybrid-search.md
-- Pattern: P1.1 Hybrid Search
-- =============================================================================

-- =============================================================================
-- 1. tsvector-Spalten + GIN-Indexes
-- =============================================================================

-- best_practices: generated tsvector (title gewichtet A, content gewichtet B)
ALTER TABLE best_practices
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('german', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('german', coalesce(content, '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_best_practices_search_vector
  ON best_practices USING GIN (search_vector);

-- community_posts: generated tsvector (title A, content B)
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('german', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('german', coalesce(content, '')), 'B')
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_community_posts_search_vector
  ON community_posts USING GIN (search_vector);

-- =============================================================================
-- 2. Hybrid Search SQL-Funktionen (RRF-Fusion)
-- =============================================================================

-- hybrid_search_best_practices:
--   Kombiniert Full-Text (tsvector/GIN) und semantische Suche (pgvector/HNSW)
--   via Reciprocal Rank Fusion: score = 1/(rrf_k + ft_rank) + 1/(rrf_k + sem_rank)
--
-- SECURITY INVOKER (default): laeuft mit Rechten des Aufrufers — RLS greift.
-- SET search_path sichert gegen search_path-Hijacking (vgl. Migration 00019).

CREATE OR REPLACE FUNCTION hybrid_search_best_practices(
  query_text text,
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  full_text_weight float DEFAULT 1.0,
  semantic_weight float DEFAULT 1.0,
  rrf_k int DEFAULT 60
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
    LIMIT LEAST(match_count, 30) * 2
  ),
  semantic AS (
    SELECT bp.id,
           row_number() OVER (
             ORDER BY bp.embedding <=> query_embedding
           ) AS rank_ix
    FROM best_practices bp
    WHERE bp.embedding IS NOT NULL
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
  WHERE ft.id IS NOT NULL OR s.id IS NOT NULL
  ORDER BY score DESC
  LIMIT LEAST(match_count, 30);
$$;

COMMENT ON FUNCTION hybrid_search_best_practices IS
  'Hybrid Search fuer best_practices: RRF-Fusion aus tsvector-Full-Text (GIN) '
  'und pgvector-Semantic-Search (HNSW). ADR-014.';

-- hybrid_search_community_posts: analog fuer community_posts

CREATE OR REPLACE FUNCTION hybrid_search_community_posts(
  query_text text,
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  full_text_weight float DEFAULT 1.0,
  semantic_weight float DEFAULT 1.0,
  rrf_k int DEFAULT 60
)
RETURNS TABLE (id uuid, title text, content text, score float)
LANGUAGE sql STABLE PARALLEL SAFE
SET search_path = public, extensions
AS $$
  WITH full_text AS (
    SELECT cp.id,
           row_number() OVER (
             ORDER BY ts_rank_cd(cp.search_vector, websearch_to_tsquery('german', query_text)) DESC
           ) AS rank_ix
    FROM community_posts cp
    WHERE cp.search_vector @@ websearch_to_tsquery('german', query_text)
    LIMIT LEAST(match_count, 30) * 2
  ),
  semantic AS (
    SELECT cp.id,
           row_number() OVER (
             ORDER BY cp.embedding <=> query_embedding
           ) AS rank_ix
    FROM community_posts cp
    WHERE cp.embedding IS NOT NULL
    LIMIT LEAST(match_count, 30) * 2
  )
  SELECT
    cp.id,
    cp.title,
    cp.content,
    (
      coalesce(1.0 / (rrf_k + ft.rank_ix), 0.0) * full_text_weight +
      coalesce(1.0 / (rrf_k + s.rank_ix), 0.0) * semantic_weight
    )::float AS score
  FROM community_posts cp
  LEFT JOIN full_text ft ON ft.id = cp.id
  LEFT JOIN semantic s ON s.id = cp.id
  WHERE ft.id IS NOT NULL OR s.id IS NOT NULL
  ORDER BY score DESC
  LIMIT LEAST(match_count, 30);
$$;

COMMENT ON FUNCTION hybrid_search_community_posts IS
  'Hybrid Search fuer community_posts: RRF-Fusion aus tsvector-Full-Text (GIN) '
  'und pgvector-Semantic-Search. ADR-014. '
  'HINWEIS: community_posts.embedding-Spalte muss separat ergaenzt werden '
  'falls noch nicht vorhanden — semantic_weight=0 als Fallback nutzbar.';

-- =============================================================================
-- 3. ai_call_logs — Telemetrie-Tabelle (LLM-Reduktions-Tracking)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_call_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  feature text NOT NULL,
  call_type text NOT NULL CHECK (call_type IN ('llm', 'hybrid', 'skipped')),
  provider text,
  tokens_used int,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_call_logs ENABLE ROW LEVEL SECURITY;

-- RLS: Nutzer lesen nur eigene Logs
CREATE POLICY "ai_call_logs_select_own"
  ON ai_call_logs FOR SELECT
  USING (user_id = auth.uid());

-- RLS: Nutzer koennen eigene Logs schreiben (oder anonyme Logs mit user_id IS NULL)
CREATE POLICY "ai_call_logs_insert_own"
  ON ai_call_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- UPDATE/DELETE intentionally omitted: RLS default = deny-all
-- Telemetrie-Logs sind append-only, niemand darf sie nachtraeglich aendern

CREATE INDEX IF NOT EXISTS idx_ai_call_logs_user_created
  ON ai_call_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_call_logs_call_type
  ON ai_call_logs (call_type, created_at DESC);

COMMENT ON TABLE ai_call_logs IS
  'Telemetrie-Log fuer LLM- und Hybrid-Search-Aufrufe. '
  'Dient dem Tracking der LLM-Kostenreduktion durch Hybrid-Search (ADR-014).';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
