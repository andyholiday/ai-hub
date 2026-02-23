// =============================================================================
// Semantic Search API
// POST /api/search
// Accepts a natural-language query, generates an embedding, and returns
// the most similar best practices from pgvector.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generateEmbedding, getEmbeddingConfig } from "@/lib/ai/embeddings";
import {
  apiSuccess,
  apiBadRequest,
  apiInternalError,
  apiValidationError,
  apiError,
} from "@/lib/api/response";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import { semanticSearchSchema } from "@/lib/validators/search";
import type { Database } from "@/lib/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SearchResultItem {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  aiTags: string[];
  authorId: string;
  authorName: string | null;
  authorAvatar: string | null;
  viewsCount: number;
  upvotesCount: number;
  commentsCount: number;
  similarity: number;
  createdAt: string;
}

interface SearchResponse {
  results: SearchResultItem[];
  meta: {
    query: string;
    totalResults: number;
    limit: number;
    offset: number;
    embeddingProvider: string;
    embeddingModel: string;
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // --- Auth check ---
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }

    // --- Rate limiting ---
    const rl = await rateLimit(req, "search", user.id);
    if (!rl.success) {
      return NextResponse.json(
        { data: null, error: { code: "RATE_LIMITED", message: "Rate limit exceeded. Please try again later." } },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    // --- Parse and validate request body ---
    const body: unknown = await req.json();
    const parsed = semanticSearchSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { query, threshold, limit, offset, category, tags, difficulty } =
      parsed.data;

    // --- Generate embedding for the search query ---
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(query);
    } catch (embeddingError) {
      const message =
        embeddingError instanceof Error
          ? embeddingError.message
          : "Failed to generate query embedding";
      return apiBadRequest(message);
    }

    // --- Call the Supabase RPC function ---
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "match_best_practices" as never,
      {
        query_embedding: `[${queryEmbedding.join(",")}]`,
        match_threshold: threshold,
        match_count: limit,
        match_offset: offset,
        filter_category: category ?? null,
        filter_tags: tags ?? null,
        filter_difficulty: difficulty ?? null,
      } as never,
    );

    if (rpcError) {
      return apiInternalError(
        `Semantic search failed: ${rpcError.message}`,
      );
    }

    // --- Map results to response format ---
    const rows = (rpcData ?? []) as Array<{
      id: string;
      title: string;
      excerpt: string | null;
      category: string;
      tags: string[];
      ai_tags: string[];
      author_id: string;
      author_name: string | null;
      author_avatar: string | null;
      views_count: number;
      upvotes_count: number;
      comments_count: number;
      similarity: number;
      created_at: string;
    }>;

    const results: SearchResultItem[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      excerpt: row.excerpt,
      category: row.category,
      tags: row.tags ?? [],
      aiTags: row.ai_tags ?? [],
      authorId: row.author_id,
      authorName: row.author_name,
      authorAvatar: row.author_avatar,
      viewsCount: row.views_count,
      upvotesCount: row.upvotes_count,
      commentsCount: row.comments_count,
      similarity: row.similarity,
      createdAt: row.created_at,
    }));

    const embeddingConfig = getEmbeddingConfig();

    const response: SearchResponse = {
      results,
      meta: {
        query,
        totalResults: results.length,
        limit,
        offset,
        embeddingProvider: embeddingConfig.provider,
        embeddingModel: embeddingConfig.model,
      },
    };

    return apiSuccess(response);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return apiInternalError(message);
  }
}
