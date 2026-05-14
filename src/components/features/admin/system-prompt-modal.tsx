"use client";

// =============================================================================
// System Prompt Modal
// Replaces window.prompt for editing AI system prompt texts.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { X, FileText } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SystemPromptModalProps {
  open: boolean;
  initialPrompt: string;
  /** Which prompt is being edited, e.g. "chat" / "mentor" */
  promptKey: string;
  onClose: () => void;
  onSave: (newPrompt: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SystemPromptModal({
  open,
  initialPrompt,
  promptKey,
  onClose,
  onSave,
}: SystemPromptModalProps) {
  const [text, setText] = useState(initialPrompt);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when modal opens.
  useEffect(() => {
    if (open) {
      setText(initialPrompt);
      setError(null);
      const timer = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally omits initialPrompt: snapshot on open only, not on every parent re-render
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleSave = useCallback(async () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      setError("Prompt-Text darf nicht leer sein.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(trimmed);
      onClose();
    } catch {
      setError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setIsSaving(false);
    }
  }, [text, onSave, onClose]);

  if (!open) return null;

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
        aria-labelledby="system-prompt-modal-title"
        className="w-full max-w-lg rounded-[14px] border border-surface-200 bg-white p-6 shadow-xl animate-fade-in"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary-50">
              <FileText className="h-4 w-4 text-brand-primary-600" strokeWidth={2} />
            </div>
            <h2
              id="system-prompt-modal-title"
              className="text-base font-bold text-surface-900"
            >
              Prompt bearbeiten — {promptKey}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700"
            aria-label="Modal schliessen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Textarea */}
        <div>
          <label
            htmlFor="spm-prompt-text"
            className="mb-1.5 block text-[13px] font-semibold text-surface-700"
          >
            Prompt-Text
          </label>
          <textarea
            ref={textareaRef}
            id="spm-prompt-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            rows={8}
            disabled={isSaving}
            className={cn(
              "w-full resize-y rounded-lg border px-3 py-2.5 font-mono text-sm text-surface-900",
              "focus:outline-none focus:ring-2 focus:ring-brand-primary-500 focus:ring-offset-1",
              "placeholder:text-surface-300 border-surface-200 bg-[#F7F8FA]",
            )}
          />
        </div>

        {/* Validation error */}
        {error && (
          <p className="mt-2 text-[12px] text-red-600" role="alert">
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
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Speichern..." : "Speichern"}
          </Button>
        </div>
      </div>
    </div>
  );
}
