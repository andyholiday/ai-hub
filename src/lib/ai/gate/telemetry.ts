// =============================================================================
// LLM Gate — Telemetrie (Pattern P1.2)
// Fire-and-forget INSERT in ai_call_logs.
// Hauptzweck dieser Wave: Daten-Sammlung fuer spaeteren Classifier (Wave 4).
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GateDecision, ComplexityScore } from './types';

/**
 * Loggt eine Gate-Entscheidung in ai_call_logs.
 *
 * Fire-and-forget: Fehler werden geloggt aber nie propagiert.
 * Ein Telemetrie-Fehler darf keinen Chat blockieren.
 */
export async function logGateDecision(
  supabase: SupabaseClient,
  userId: string | null,
  decision: GateDecision,
  complexity: ComplexityScore,
  feature: string,
): Promise<void> {
  const callType = decision.route === 'local' ? 'skipped' : 'llm';
  const provider = decision.route === 'llm' && decision.reason !== 'fallback' ? null : null;

  void (async () => {
    try {
      const { error } = await supabase.from('ai_call_logs').insert({
        user_id: userId,
        feature,
        call_type: callType,
        provider,
        tokens_used: null,
        // Speichert Komplexitaets-Metriken im provider-Feld nicht moeglich —
        // tokens_used bleibt null bei skipped, wird post-LLM gesetzt bei llm.
      });

      if (error) {
        console.warn('[gate/telemetry] Insert failed:', error.message);
      }
    } catch (err) {
      console.warn('[gate/telemetry] Unexpected error:', err);
    }
  })().catch(() => {});
}
