// =============================================================================
// LocalSearch — Privacy-Mode In-Browser Semantic Search (Pattern P4.1)
// ADR-010: Privacy Mode — Local Embeddings
//
// CRITICAL: This module uses the 384-d LocalEmbeddingService (all-MiniLM-L6-v2).
// These vectors MUST NOT be compared against or mixed with the server-side
// pgvector index which is 1536-d (OpenAI text-embedding-3-small).
// This index is entirely self-contained in memory.
// =============================================================================

import { getInstance } from '@/lib/ai/local-embeddings';

// ---------------------------------------------------------------------------
// Corpus item — the document set that gets indexed
// ---------------------------------------------------------------------------

export interface LocalCorpusItem {
  readonly id: string;
  readonly title: string;
  readonly content: string;
}

// ---------------------------------------------------------------------------
// Local search result (mirrors SearchResult in command-palette for compatibility)
// ---------------------------------------------------------------------------

export interface LocalSearchResult {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly score: number;
}

// ---------------------------------------------------------------------------
// Status reported to callers
// ---------------------------------------------------------------------------

export type LocalIndexStatus = 'uninitialized' | 'loading' | 'ready' | 'error';

// ---------------------------------------------------------------------------
// Internal index entry
// ---------------------------------------------------------------------------

interface IndexEntry {
  item: LocalCorpusItem;
  // 384-d embedding vector — only from LocalEmbeddingService
  embedding: number[];
}

// ---------------------------------------------------------------------------
// Cosine similarity — operates entirely on 384-d vectors
// ---------------------------------------------------------------------------

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    magA += ai * ai;
    magB += bi * bi;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ---------------------------------------------------------------------------
// Substring fallback — used when embedding is not available
// ---------------------------------------------------------------------------

function substringSearch(
  corpus: LocalCorpusItem[],
  query: string,
  topK: number,
): LocalSearchResult[] {
  const q = query.toLowerCase();
  return corpus
    .filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q),
    )
    .slice(0, topK)
    .map((item) => ({ id: item.id, title: item.title, content: item.content, score: 1 }));
}

// ---------------------------------------------------------------------------
// LocalSearchIndex — main class
// ---------------------------------------------------------------------------

export class LocalSearchIndex {
  private entries: IndexEntry[] = [];
  private corpus: LocalCorpusItem[] = [];
  private status: LocalIndexStatus = 'uninitialized';
  private buildPromise: Promise<void> | null = null;
  private modelProgress = 0;

  /** Progress during model download/init (0–100). Read by UI. */
  get progress(): number {
    return this.modelProgress;
  }

  get indexStatus(): LocalIndexStatus {
    return this.status;
  }

  /**
   * Build (or return cached) the in-memory index for the given corpus.
   * Safe to call multiple times — re-uses the in-flight promise.
   *
   * Embeddings are 384-d only. Never stored server-side or compared to
   * the 1536-d pgvector index.
   */
  async build(corpus: LocalCorpusItem[]): Promise<void> {
    // If corpus changed, reset. (For this use-case corpus is static, so == check is enough.)
    if (this.status === 'ready' && this.corpus === corpus) return;
    if (this.buildPromise && this.corpus === corpus) return this.buildPromise;

    this.corpus = corpus;
    this.status = 'loading';
    this.entries = [];

    this.buildPromise = this._doBuild(corpus).then(
      () => {
        this.status = 'ready';
        this.buildPromise = null;
      },
      () => {
        // Build failed — keep corpus so fallback search still works
        this.status = 'error';
        this.buildPromise = null;
      },
    );

    return this.buildPromise;
  }

  /**
   * Search the local index.
   *
   * - When status is 'ready': returns cosine-ranked results (384-d).
   * - When status is 'loading'/'error'/'uninitialized': falls back to
   *   client-side substring filter. Does not throw.
   */
  async search(query: string, topK = 8): Promise<LocalSearchResult[]> {
    const q = query.trim();
    if (!q) return [];

    if (this.status !== 'ready' || this.entries.length === 0) {
      // Graceful degradation: substring filter over corpus
      return substringSearch(this.corpus, q, topK);
    }

    const svc = getInstance();
    if (!svc) {
      return substringSearch(this.corpus, q, topK);
    }

    let queryVec: number[];
    try {
      queryVec = await svc.embed(q);
    } catch {
      return substringSearch(this.corpus, q, topK);
    }

    return this.entries
      .map((entry) => ({
        id: entry.item.id,
        title: entry.item.title,
        content: entry.item.content,
        score: cosineSimilarity(queryVec, entry.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private async _doBuild(corpus: LocalCorpusItem[]): Promise<void> {
    const svc = getInstance();
    if (!svc) throw new Error('[LocalSearchIndex] LocalEmbeddingService unavailable (SSR?)');

    svc.setProgressCallback((p) => {
      this.modelProgress = p;
    });

    // Initialize (loads model) — will resolve immediately on subsequent calls
    await svc.init();

    // Embed each corpus item sequentially to avoid saturating the worker
    const entries: IndexEntry[] = [];
    for (const item of corpus) {
      // Each embed() produces a 384-d vector — never mixed with server 1536-d vectors
      const embedding = await svc.embed(`${item.title}. ${item.content}`);
      entries.push({ item, embedding });
    }
    this.entries = entries;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

let _index: LocalSearchIndex | null = null;

/** Returns the shared LocalSearchIndex instance. SSR-safe (returns null on server). */
export function getLocalSearchIndex(): LocalSearchIndex | null {
  if (typeof window === 'undefined') return null;
  if (!_index) {
    _index = new LocalSearchIndex();
  }
  return _index;
}
