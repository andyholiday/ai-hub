'use client';

// =============================================================================
// EmbeddingLoadProgress
// Shows the download/init progress of the local embedding model.
// Pattern P4.1 | ADR-010
// =============================================================================

export type EmbeddingLoadState = 'idle' | 'loading' | 'ready' | 'error';

interface EmbeddingLoadProgressProps {
  progress: number; // 0–100
  state: EmbeddingLoadState;
}

export function EmbeddingLoadProgress({ progress, state }: EmbeddingLoadProgressProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  if (state === 'idle') return null;

  if (state === 'ready') {
    return (
      <p
        className="text-sm text-green-600 dark:text-green-400"
        aria-live="polite"
        role="status"
      >
        Modell geladen — Privacy Mode aktiv
      </p>
    );
  }

  if (state === 'error') {
    return (
      <p
        className="text-sm text-red-600 dark:text-red-400"
        aria-live="assertive"
        role="alert"
      >
        Modell konnte nicht geladen werden. Bitte Seite neu laden.
      </p>
    );
  }

  // state === 'loading'
  return (
    <div aria-live="polite" className="space-y-1">
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Modell wird geladen&#8230; {Math.round(clampedProgress)}%
      </p>
      <div
        role="progressbar"
        aria-valuenow={Math.round(clampedProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Modell-Ladefortschritt"
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
