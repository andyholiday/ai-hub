"use client";

// =============================================================================
// Provider Key Modal
// Secure input modal for setting/updating a provider's API key.
// - Input is always type="password", never pre-filled with an existing key.
// - Key is cleared from state immediately after a successful save.
// - Modal closes on successful save or on Cancel/Escape.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Key } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProviderKeyModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Provider display name shown in the heading */
  providerName: string;
  /** Whether this provider already has a key stored (changes button label) */
  hasKey: boolean;
  /** Called with the plaintext key on submit. Return true on success. */
  onSave: (key: string) => Promise<boolean>;
  /** Called when modal should close (cancel or after save) */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProviderKeyModal({
  isOpen,
  providerName,
  hasKey,
  onSave,
  onClose,
}: ProviderKeyModalProps) {
  const [key, setKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the input when modal opens; clear state when closed
  useEffect(() => {
    if (isOpen) {
      setKey("");
      setError(null);
      // Delay to allow CSS transition before focussing
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!key.trim()) {
        setError("Bitte einen API-Key eingeben.");
        return;
      }

      setIsSaving(true);
      setError(null);

      const success = await onSave(key.trim());

      setIsSaving(false);

      if (success) {
        // Clear key from state immediately — never keep plaintext after save
        setKey("");
        onClose();
      } else {
        setError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
      }
    },
    [key, onSave, onClose],
  );

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="provider-key-modal-title"
        className={cn(
          "w-full max-w-md rounded-[14px] border border-surface-200 bg-white p-6 shadow-xl",
          "animate-fade-in",
        )}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary-50">
              <Key className="h-4.5 w-4.5 text-brand-primary-600" strokeWidth={2} />
            </div>
            <h2
              id="provider-key-modal-title"
              className="text-base font-bold text-surface-900"
            >
              {hasKey ? "API-Key ändern" : "API-Key setzen"} — {providerName}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700"
            aria-label="Modal schließen"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label
              htmlFor="provider-api-key-input"
              className="mb-1.5 block text-[13px] font-semibold text-surface-700"
            >
              API-Key
            </label>
            <input
              ref={inputRef}
              id="provider-api-key-input"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 font-mono text-sm text-surface-900",
                "focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-1",
                "placeholder:text-surface-300",
                error
                  ? "border-red-400 bg-red-50"
                  : "border-surface-200 bg-[#F7F8FA]",
              )}
              disabled={isSaving}
            />
            {error && (
              <p className="mt-1.5 text-[12px] text-red-600" role="alert">
                {error}
              </p>
            )}
            <p className="mt-2 text-[12px] text-surface-400">
              Der Key wird verschlüsselt im Vault gespeichert und nie im Klartext angezeigt.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
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
              disabled={isSaving || !key.trim()}
            >
              {isSaving ? "Speichern..." : "Key speichern"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
