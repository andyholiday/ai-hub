'use client';

// =============================================================================
// DependencyWarningSheet (Pattern P2.3)
// Zeigt dem User die Konsequenz eines Toggle-Eingriffs an.
// Wird von FeatureToggle gerendert wenn ToggleAction.kind !== 'allow'.
//
// ARIA: alertdialog-Pattern mit Focus-Trap (analog consent-banner.tsx).
// Keine externe Modal-Library.
// =============================================================================

import { useEffect, useRef } from 'react';
import { getFeature } from '@/lib/features/feature-registry';
import type { ToggleAction } from '@/lib/features/dependency-types';
import type { FeatureId } from '@/lib/features/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DependencyWarningSheetProps {
  action: Exclude<ToggleAction, { kind: 'allow' }>;
  onConfirm: () => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Helper: Feature-Label aus Registry
// ---------------------------------------------------------------------------

function featureLabel(id: FeatureId): string {
  try {
    return getFeature(id).label;
  } catch {
    return id;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DependencyWarningSheet({
  action,
  onConfirm,
  onCancel,
}: DependencyWarningSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryBtnRef = useRef<HTMLButtonElement>(null);

  // Focus-Trap (Pattern aus consent-banner.tsx)
  useEffect(() => {
    primaryBtnRef.current?.focus();

    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (action.kind !== 'blocked') onCancel();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = Array.from(
        dialog!.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));

      if (focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    dialog.addEventListener('keydown', handleKeyDown);
    return () => dialog.removeEventListener('keydown', handleKeyDown);
  }, [action.kind, onCancel]);

  // ---------------------------------------------------------------------------
  // Render-Varianten
  // ---------------------------------------------------------------------------

  const isBlocked = action.kind === 'blocked';

  let title: string;
  let featureIds: FeatureId[];
  let bodyText: string;

  if (action.kind === 'cascade-off') {
    title = 'Abhaengige Features werden mitdeaktiviert';
    featureIds = action.cascadeIds;
    bodyText = 'Folgende Features werden ebenfalls deaktiviert:';
  } else if (action.kind === 'warn') {
    title = 'Abhaengige Features betroffen';
    featureIds = action.warnIds;
    bodyText = 'Folgende Features haengen von diesem Feature ab:';
  } else {
    // blocked
    title = 'Deaktivierung blockiert';
    featureIds = action.blockerIds;
    bodyText = 'Bitte zuerst deaktivieren:';
  }

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dep-sheet-title"
        aria-describedby="dep-sheet-desc"
        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <h2
          id="dep-sheet-title"
          className="text-base font-semibold text-surface-900"
        >
          {title}
        </h2>

        <p id="dep-sheet-desc" className="mt-2 text-sm text-surface-600">
          {bodyText}
        </p>

        <ul className="mt-2 space-y-1" aria-label="Betroffene Features">
          {featureIds.map((id) => (
            <li
              key={id}
              className="flex items-center gap-2 text-sm text-surface-700"
            >
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-surface-400" />
              {featureLabel(id)}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          {isBlocked ? (
            <button
              ref={primaryBtnRef}
              type="button"
              onClick={onCancel}
              className="w-full rounded-lg bg-brand-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500 sm:w-auto"
            >
              Verstanden
            </button>
          ) : (
            <>
              <button
                ref={primaryBtnRef}
                type="button"
                onClick={onConfirm}
                className="w-full rounded-lg bg-brand-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500 sm:w-auto"
              >
                {action.kind === 'cascade-off'
                  ? 'Bestaetigen'
                  : 'Trotzdem deaktivieren'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-500 sm:w-auto"
              >
                Abbrechen
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
