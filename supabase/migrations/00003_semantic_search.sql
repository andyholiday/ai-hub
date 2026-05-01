-- =============================================================================
-- AI Hub - Semantic Search RPC Functions
-- Version: 00003
-- Date: 2026-02-20
-- Description: Enhanced RPC functions for pgvector semantic search with
--   filtering support (category, tags, difficulty) and pagination.
-- =============================================================================

-- =============================================================================
-- 1. FUNCTION: match_best_practices
-- Primary semantic search function with full filtering and pagination.
-- Called from the /api/search route via supabase.rpc().
-- =============================================================================

CREATE OR REPLACE FUNCTION match_best_practices(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  match_offset int DEFAULT 0,
  filter_category text DEFAULT NULL,
  filter_tags text[] DEFAULT NULL,
  filter_difficulty text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  excerpt TEXT,
  category best_practice_category,
  tags TEXT[],
  ai_tags TEXT[],
  difficulty TEXT,
  author_id UUID,
  author_name TEXT,
  author_avatar TEXT,
  views_count INTEGER,
  upvotes_count INTEGER,
  comments_count INTEGER,
  similarity FLOAT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bp.id,
    bp.title,
    bp.content,
    bp.excerpt,
    bp.category,
    bp.tags,
    bp.ai_tags,
    bp.category::text AS difficulty,  -- placeholder; real difficulty from enum if available
    bp.author_id,
    p.full_name AS author_name,
    p.avatar_url AS author_avatar,
    bp.views_count,
    bp.upvotes_count,
    bp.comments_count,
    1 - (bp.embedding <=> query_embedding) AS similarity,
    bp.created_at
  FROM best_practices bp
  LEFT JOIN profiles p ON p.id = bp.author_id
  WHERE bp.status = 'published'
    AND bp.embedding IS NOT NULL
    AND 1 - (bp.embedding <=> query_embedding) > match_threshold
    -- Optional category filter
    AND (filter_category IS NULL OR bp.category::text = filter_category)
    -- Optional tags filter (match ANY of the provided tags)
    AND (filter_tags IS NULL OR bp.tags && filter_tags OR bp.ai_tags && filter_tags)
    -- Optional difficulty filter (stored in tags or category context)
    AND (filter_difficulty IS NULL OR filter_difficulty = ANY(bp.tags))
  ORDER BY bp.embedding <=> query_embedding
  LIMIT match_count
  OFFSET match_offset;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION match_best_practices IS
  'Semantic similarity search over best_practices using pgvector cosine distance. '
  'Supports filtering by category, tags, and difficulty with pagination.';

-- =============================================================================
-- 2. FUNCTION: match_best_practices_count
-- Returns the total count of matches (for pagination metadata).
-- =============================================================================

CREATE OR REPLACE FUNCTION match_best_practices_count(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  filter_category text DEFAULT NULL,
  filter_tags text[] DEFAULT NULL,
  filter_difficulty text DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO total
  FROM best_practices bp
  WHERE bp.status = 'published'
    AND bp.embedding IS NOT NULL
    AND 1 - (bp.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR bp.category::text = filter_category)
    AND (filter_tags IS NULL OR bp.tags && filter_tags OR bp.ai_tags && filter_tags)
    AND (filter_difficulty IS NULL OR filter_difficulty = ANY(bp.tags));

  RETURN total;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION match_best_practices_count IS
  'Returns total count of semantic search matches for pagination metadata.';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
