'use client';

// =============================================================================
// ModerationSpikePage — Browser-ONNX Demo (Spike P1.3)
// =============================================================================

import { useState } from 'react';
import { classifyToxicity, getModelState } from '@/lib/moderation/browser-classifier';
import type { ToxicityScore } from '@/lib/moderation/types';

export function ModerationSpikePage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ToxicityScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [modelStatus, setModelStatus] = useState<string>('idle');

  async function handleClassify() {
    if (!text.trim()) return;
    setIsRunning(true);
    setError(null);
    setResult(null);
    setModelStatus(getModelState());

    try {
      const score = await classifyToxicity(text);
      setResult(score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setIsRunning(false);
      setModelStatus(getModelState());
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Browser-ONNX Toxicity Spike
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Pattern P1.3 — Modell:{' '}
          <code className="rounded bg-gray-100 px-1 text-xs">Xenova/toxic-bert</code>{' '}
          (quantized, ~67 MB)
        </p>
      </div>

      <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
        Beim ersten Aufruf wird das Modell heruntergeladen (~67 MB). Danach
        aus dem Browser-Cache geladen (&lt;500 ms).
      </div>

      <div className="space-y-2">
        <label htmlFor="text-input" className="block text-sm font-medium text-gray-700">
          Text eingeben
        </label>
        <textarea
          id="text-input"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Beispiel: This is a test message..."
          className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={handleClassify}
        disabled={isRunning || !text.trim()}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRunning ? 'Klassifizierung...' : 'Klassifizieren'}
      </button>

      {isRunning && (
        <div className="text-sm text-gray-500">
          Modell-Status: <span className="font-mono">{modelStatus}</span>
          {modelStatus === 'loading' && ' — Modell wird geladen, bitte warten...'}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {result && (
        <div className="rounded-md border border-gray-200 p-4 space-y-2">
          <h2 className="text-sm font-semibold text-gray-700">Ergebnis</h2>
          <div className="flex items-center gap-3">
            <span
              className={
                result.label === 'toxic'
                  ? 'rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700'
                  : 'rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700'
              }
            >
              {result.label}
            </span>
            <span className="text-sm text-gray-600">
              Score: <strong>{(result.score * 100).toFixed(1)}%</strong>
            </span>
            <span className="text-sm text-gray-400">
              Latenz: {result.latencyMs} ms
            </span>
          </div>
        </div>
      )}

      <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-400">
        Modell-Status: <span className="font-mono">{getModelState()}</span>
      </div>
    </div>
  );
}
