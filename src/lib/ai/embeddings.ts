// =============================================================================
// Embedding Service
// Generates text embeddings via OpenAI text-embedding-3-small (1536 dims).
// Falls back to a local keyword-based search vector when no API key is set.
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokensUsed: number;
}

export interface EmbeddingBatchResult {
  embeddings: number[][];
  model: string;
  totalTokensUsed: number;
}

/** Dimension count matching the pgvector column in best_practices. */
const EMBEDDING_DIMENSIONS = 1536;
const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";

// ---------------------------------------------------------------------------
// OpenAI Embedding Generation
// ---------------------------------------------------------------------------

/**
 * Call the OpenAI embeddings API for a single text input.
 */
async function fetchOpenAIEmbedding(
  text: string,
  apiKey: string,
): Promise<EmbeddingResult> {
  const response = await fetch(OPENAI_EMBEDDING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: OPENAI_EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenAI Embedding API error (${response.status}): ${body}`,
    );
  }

  const json = (await response.json()) as {
    data: Array<{ embedding: number[] }>;
    usage: { prompt_tokens: number; total_tokens: number };
    model: string;
  };

  const firstEntry = json.data[0];
  if (!firstEntry) {
    throw new Error("OpenAI Embedding API returned no data");
  }

  return {
    embedding: firstEntry.embedding,
    model: json.model,
    tokensUsed: json.usage.total_tokens,
  };
}

/**
 * Call the OpenAI embeddings API for a batch of text inputs.
 */
async function fetchOpenAIEmbeddings(
  texts: string[],
  apiKey: string,
): Promise<EmbeddingBatchResult> {
  const response = await fetch(OPENAI_EMBEDDING_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: OPENAI_EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `OpenAI Embedding API error (${response.status}): ${body}`,
    );
  }

  const json = (await response.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
    usage: { prompt_tokens: number; total_tokens: number };
    model: string;
  };

  // Ensure correct ordering by index
  const sorted = [...json.data].sort((a, b) => a.index - b.index);

  return {
    embeddings: sorted.map((d) => d.embedding),
    model: json.model,
    totalTokensUsed: json.usage.total_tokens,
  };
}

// ---------------------------------------------------------------------------
// Local Keyword Fallback
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic keyword-based pseudo-embedding.
 * This is NOT semantically meaningful but allows the system to function
 * without an OpenAI key by using simple term-frequency hashing.
 *
 * The vector is normalised to unit length so cosine distance remains valid
 * for basic keyword overlap comparison.
 */
function generateKeywordEmbedding(text: string): number[] {
  const vector = new Float64Array(EMBEDDING_DIMENSIONS);

  // Normalise and tokenise
  const tokens = text
    .toLowerCase()
    .replace(/[^a-zäöüß0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);

  // Hash each token into a position in the vector
  for (const token of tokens) {
    const hash = simpleHash(token);
    const index = Math.abs(hash) % EMBEDDING_DIMENSIONS;
    vector[index] = (vector[index] ?? 0) + 1;
  }

  // L2-normalise
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    const val = vector[i] ?? 0;
    norm += val * val;
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      vector[i] = (vector[i] ?? 0) / norm;
    }
  }

  return Array.from(vector);
}

/**
 * Simple FNV-1a hash for strings.
 */
function simpleHash(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether the OpenAI embedding API is available.
 */
function isOpenAIAvailable(): boolean {
  return typeof process.env.OPENAI_API_KEY === "string"
    && process.env.OPENAI_API_KEY.length > 0;
}

/**
 * Generate an embedding vector for a single text string.
 *
 * Uses OpenAI `text-embedding-3-small` when an API key is configured.
 * Falls back to a local keyword-based pseudo-embedding otherwise.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) {
    throw new Error("Cannot generate embedding for empty text");
  }

  if (isOpenAIAvailable()) {
    const result = await fetchOpenAIEmbedding(
      text,
      process.env.OPENAI_API_KEY as string,
    );
    return result.embedding;
  }

  // Fallback: keyword-based embedding
  return generateKeywordEmbedding(text);
}

/**
 * Generate embedding vectors for multiple texts in a single batch request.
 *
 * Uses OpenAI batch API when available; otherwise generates keyword
 * embeddings individually.
 */
export async function generateEmbeddings(
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const nonEmpty = texts.map((t) => t.trim());
  if (nonEmpty.some((t) => t.length === 0)) {
    throw new Error("Cannot generate embedding for empty text in batch");
  }

  if (isOpenAIAvailable()) {
    const result = await fetchOpenAIEmbeddings(
      nonEmpty,
      process.env.OPENAI_API_KEY as string,
    );
    return result.embeddings;
  }

  // Fallback: keyword-based embeddings (no batching needed)
  return nonEmpty.map(generateKeywordEmbedding);
}

/**
 * Return metadata about the current embedding configuration.
 */
export function getEmbeddingConfig(): {
  provider: "openai" | "local-keyword";
  model: string;
  dimensions: number;
} {
  if (isOpenAIAvailable()) {
    return {
      provider: "openai",
      model: OPENAI_EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    };
  }
  return {
    provider: "local-keyword",
    model: "keyword-hash-fnv1a",
    dimensions: EMBEDDING_DIMENSIONS,
  };
}
