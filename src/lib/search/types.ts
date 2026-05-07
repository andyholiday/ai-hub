// =============================================================================
// Hybrid Search — Types (ADR-014)
// =============================================================================

/** Ein Suchergebnis aus hybrid_search_best_practices. */
export interface HybridSearchResult {
  /** UUID des Eintrags. */
  readonly id: string;
  /** Titel des Eintrags. */
  readonly title: string;
  /** Inhalt des Eintrags. */
  readonly content: string;
  /** RRF-Fusions-Score (hoeher = relevanter). */
  readonly score: number;
}

/** Optionale Gewichte fuer die RRF-Fusion. */
export interface HybridSearchWeights {
  /** Gewicht fuer Full-Text-Anteil (Default: 1.0). */
  readonly fullTextWeight?: number;
  /** Gewicht fuer Semantic-Anteil (Default: 1.0). */
  readonly semanticWeight?: number;
  /** RRF-Glaettungskonstante k (Default: 60). */
  readonly rrfK?: number;
}

/** Input fuer hybridSearchBestPractices. */
export interface HybridSearchInput {
  /** Suchtext (muss nicht-leer sein). */
  readonly query: string;
  /**
   * Vorberechneter Embedding-Vektor (1536 Dimensionen).
   * Wenn nicht angegeben, wird er intern generiert.
   * Bei Embedding-Fehler laeuft die Suche als reiner Full-Text-Fallback.
   */
  readonly embedding?: readonly number[];
  /** Anzahl der gewuenschten Ergebnisse (1-30). */
  readonly topK: number;
  /** Optionale Gewichtsanpassungen fuer die RRF-Fusion. */
  readonly weights?: HybridSearchWeights;
}
