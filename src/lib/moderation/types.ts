// =============================================================================
// Moderation Types — Browser-ONNX Spike (Pattern P1.3)
// =============================================================================

/** Result of a toxicity classification run. */
export interface ToxicityScore {
  label: 'safe' | 'toxic';
  score: number;
  latencyMs: number;
}

/** Full moderation result including optional NER entities. */
export interface ModerationResult {
  input: string;
  toxicity: ToxicityScore;
  entities?: Array<{
    word: string;
    entity: string;
    score: number;
  }>;
}

/** Lifecycle state of the ONNX model. */
export type ModelInitState = 'idle' | 'loading' | 'ready' | 'error';
