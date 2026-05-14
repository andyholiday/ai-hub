"use client";

// =============================================================================
// Provider Config Modal
// Edits model, max_tokens, top_p, temperature, endpoint, and budget
// for an already-configured AI provider. Replaces the window.prompt fallback.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Settings } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProviderConfigValues {
  model: string;
  temperature: string;
  max_tokens: string;
  top_p: string;
  endpoint: string;
  budget: string;
}

export interface ProviderConfigModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Provider display name shown in the heading */
  providerName: string;
  /** Current values to pre-fill the form */
  initialValues: ProviderConfigValues;
  /** Called on submit with only the fields that changed. Return true on success. */
  onSave: (updates: Record<string, unknown>) => Promise<boolean>;
  /** Called when modal should close */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildUpdates(
  initial: ProviderConfigValues,
  current: ProviderConfigValues,
): Record<string, unknown> | null {
  const updates: Record<string, unknown> = {};

  if (current.model.trim() !== initial.model.trim()) {
    const v = current.model.trim();
    if (v.length === 0) return null; // model cannot be empty if changed
    updates.model = v;
  }

  if (current.temperature !== initial.temperature) {
    const v = parseFloat(current.temperature);
    if (isNaN(v) || v < 0 || v > 2) return null;
    updates.temperature = v;
  }

  if (current.max_tokens !== initial.max_tokens) {
    const v = parseInt(current.max_tokens, 10);
    if (isNaN(v) || v < 1 || v > 100000) return null;
    updates.max_tokens = v;
  }

  if (current.top_p !== initial.top_p) {
    const v = parseFloat(current.top_p);
    if (isNaN(v) || v < 0 || v > 1) return null;
    updates.top_p = v;
  }

  if (current.endpoint.trim() !== initial.endpoint.trim()) {
    updates.endpoint = current.endpoint.trim();
  }

  if (current.budget !== initial.budget) {
    if (current.budget.trim() === "") {
      updates.monthly_budget_limit = null;
    } else {
      const v = parseFloat(current.budget);
      if (isNaN(v) || v < 0) return null;
      updates.monthly_budget_limit = v;
    }
  }

  return updates;
}

function validate(values: ProviderConfigValues): string | null {
  if (values.model.trim().length === 0) return "Modell darf nicht leer sein.";

  const temp = parseFloat(values.temperature);
  if (isNaN(temp) || temp < 0 || temp > 2) return "Temperature muss zwischen 0 und 2 liegen.";

  if (values.max_tokens.trim() !== "") {
    const mt = parseInt(values.max_tokens, 10);
    if (isNaN(mt) || mt < 1 || mt > 100000) return "Max Tokens muss zwischen 1 und 100.000 liegen.";
  }

  if (values.top_p.trim() !== "") {
    const tp = parseFloat(values.top_p);
    if (isNaN(tp) || tp < 0 || tp > 1) return "Top-P muss zwischen 0 und 1 liegen.";
  }

  if (values.budget.trim() !== "") {
    const b = parseFloat(values.budget);
    if (isNaN(b) || b < 0) return "Budget muss >= 0 sein.";
  }

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProviderConfigModal({
  isOpen,
  providerName,
  initialValues,
  onSave,
  onClose,
}: ProviderConfigModalProps) {
  const [values, setValues] = useState<ProviderConfigValues>(initialValues);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Sync form when modal opens with fresh initialValues.
  // initialValues is intentionally excluded: we snapshot on open, not on every
  // parent re-render, so the user's in-progress edits are not overwritten.
  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
      setError(null);
      const timer = setTimeout(() => firstInputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const set = useCallback(
    (field: keyof ProviderConfigValues) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setValues((prev) => ({ ...prev, [field]: e.target.value }));
        setError(null);
      },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationError = validate(values);
      if (validationError) {
        setError(validationError);
        return;
      }

      const updates = buildUpdates(initialValues, values);
      if (updates === null) {
        setError("Ungueltige Eingabe. Bitte Felder pruefen.");
        return;
      }

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      setIsSaving(true);
      setError(null);

      const success = await onSave(updates);

      setIsSaving(false);

      if (success) {
        onClose();
      } else {
        setError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
      }
    },
    [values, initialValues, onSave, onClose],
  );

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-config-modal-title"
        className="w-full max-w-md rounded-[14px] border border-surface-200 bg-white p-6 shadow-xl animate-fade-in"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary-50">
              <Settings className="h-4.5 w-4.5 text-brand-primary-600" strokeWidth={2} />
            </div>
            <h2
              id="provider-config-modal-title"
              className="text-base font-bold text-surface-900"
            >
              Konfigurieren — {providerName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700"
            aria-label="Modal schliessen"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            {/* Model */}
            <div>
              <label
                htmlFor="pcm-model"
                className="mb-1.5 block text-[13px] font-semibold text-surface-700"
              >
                Modell
              </label>
              <input
                ref={firstInputRef}
                id="pcm-model"
                type="text"
                value={values.model}
                onChange={set("model")}
                placeholder="z.B. gpt-4o"
                disabled={isSaving}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900",
                  "focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-1",
                  "placeholder:text-surface-300 border-surface-200 bg-[#F7F8FA]",
                )}
              />
            </div>

            {/* Temperature */}
            <div>
              <label
                htmlFor="pcm-temperature"
                className="mb-1.5 block text-[13px] font-semibold text-surface-700"
              >
                Temperature <span className="font-normal text-surface-400">(0 – 2)</span>
              </label>
              <input
                id="pcm-temperature"
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={values.temperature}
                onChange={set("temperature")}
                disabled={isSaving}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900",
                  "focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-1",
                  "border-surface-200 bg-[#F7F8FA]",
                )}
              />
            </div>

            {/* Max Tokens */}
            <div>
              <label
                htmlFor="pcm-max-tokens"
                className="mb-1.5 block text-[13px] font-semibold text-surface-700"
              >
                Max Tokens <span className="font-normal text-surface-400">(1 – 100.000, optional)</span>
              </label>
              <input
                id="pcm-max-tokens"
                type="number"
                min={1}
                max={100000}
                step={1}
                value={values.max_tokens}
                onChange={set("max_tokens")}
                placeholder="z.B. 4096"
                disabled={isSaving}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900",
                  "focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-1",
                  "placeholder:text-surface-300 border-surface-200 bg-[#F7F8FA]",
                )}
              />
            </div>

            {/* Top-P */}
            <div>
              <label
                htmlFor="pcm-top-p"
                className="mb-1.5 block text-[13px] font-semibold text-surface-700"
              >
                Top-P <span className="font-normal text-surface-400">(0 – 1, optional)</span>
              </label>
              <input
                id="pcm-top-p"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={values.top_p}
                onChange={set("top_p")}
                placeholder="z.B. 0.95"
                disabled={isSaving}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900",
                  "focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-1",
                  "placeholder:text-surface-300 border-surface-200 bg-[#F7F8FA]",
                )}
              />
            </div>

            {/* Endpoint */}
            <div>
              <label
                htmlFor="pcm-endpoint"
                className="mb-1.5 block text-[13px] font-semibold text-surface-700"
              >
                Endpoint <span className="font-normal text-surface-400">(optional)</span>
              </label>
              <input
                id="pcm-endpoint"
                type="url"
                value={values.endpoint}
                onChange={set("endpoint")}
                placeholder="https://api.openai.com/v1"
                disabled={isSaving}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900",
                  "focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-1",
                  "placeholder:text-surface-300 border-surface-200 bg-[#F7F8FA]",
                )}
              />
            </div>

            {/* Budget */}
            <div>
              <label
                htmlFor="pcm-budget"
                className="mb-1.5 block text-[13px] font-semibold text-surface-700"
              >
                Budget USD/Monat <span className="font-normal text-surface-400">(optional)</span>
              </label>
              <input
                id="pcm-budget"
                type="number"
                min={0}
                step={0.01}
                value={values.budget}
                onChange={set("budget")}
                placeholder="z.B. 50"
                disabled={isSaving}
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900",
                  "focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-1",
                  "placeholder:text-surface-300 border-surface-200 bg-[#F7F8FA]",
                )}
              />
            </div>
          </div>

          {/* Validation error */}
          {error && (
            <p className="mt-3 text-[12px] text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving}
            >
              {isSaving ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
