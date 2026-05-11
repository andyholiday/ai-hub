"use client";

// =============================================================================
// Orb Bubble — BubbleSpeech Component (Pattern P3.2)
// Zeigt eine proaktive Orb-Sprechblase mit Framer Motion Animation.
// aria-live="polite", role="status", ESC-dismissable.
// =============================================================================

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BubblePayload } from "@/lib/orb-rules/trigger-types";

interface BubbleSpeechProps {
  payload: BubblePayload | null;
  onDismiss: () => void;
}

export function BubbleSpeech({ payload, onDismiss }: BubbleSpeechProps) {
  useEffect(() => {
    if (!payload) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [payload, onDismiss]);

  return (
    <div aria-live="polite" role="status">
      <AnimatePresence>
        {payload && (
          <motion.div
            key="orb-bubble"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 w-64 rounded-xl bg-white shadow-lg border border-gray-100 p-4"
          >
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {payload.headline}
            </p>
            <p className="text-sm text-gray-600">{payload.body}</p>
            <button
              onClick={onDismiss}
              aria-label="Bubble schließen"
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
