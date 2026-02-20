// =============================================================================
// AI Orb Component ("Cosmos Orb" Variant)
// Persistent floating AI companion visible on every page.
//
// Features:
// - 64px round orb with LR Green-to-Gold gradient
// - Breathing box-shadow animation (3s cycle)
// - Rotating ring with gold particle (8s cycle)
// - Status dot (online indicator)
// - Hover: scale 1.1 + tooltip with pill shape
// - Click: toggles the chat panel
// - Respects prefers-reduced-motion
// =============================================================================

"use client";

import { cn } from "@/lib/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import { ChatPanel } from "./chat-panel";
import { useOrb } from "./orb-provider";

// -----------------------------------------------------------------------------
// Orb Component
// -----------------------------------------------------------------------------

export function AiOrb() {
  const {
    isExpanded,
    toggle,
    tooltipText,
    hasNotification,
    orbState,
  } = useOrb();

  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    toggle();
  }, [toggle]);

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* Chat Panel (rendered via AnimatePresence for exit animations)      */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence mode="wait">
        {isExpanded && <ChatPanel key="chat-panel" />}
      </AnimatePresence>

      {/* ----------------------------------------------------------------- */}
      {/* Orb (hidden when panel is expanded)                               */}
      {/* ----------------------------------------------------------------- */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            key="ai-orb"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            className="fixed bottom-7 right-7 z-[9999]"
          >
            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && !isExpanded && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute -top-12 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap"
                >
                  <div className="rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-surface-700 shadow-elevated">
                    {tooltipText}
                  </div>
                  {/* Arrow */}
                  <div className="mx-auto h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rotating Ring */}
            <div
              className={cn(
                "ai-orb-ring pointer-events-none absolute inset-1/2 h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 rounded-full",
                "border border-lr-green-500/15",
                { "ai-orb-ring--paused": orbState === "thinking" }
              )}
              aria-hidden="true"
            >
              {/* Gold Particle on the ring */}
              <span className="absolute -top-[3px] left-1/2 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-lr-gold-500 shadow-lr-gold" />
            </div>

            {/* Orb Button */}
            <button
              type="button"
              onClick={handleClick}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className={cn(
                "ai-orb-core group relative flex h-16 w-16 items-center justify-center rounded-full",
                "bg-gradient-to-br from-lr-green-500 to-lr-gold-500",
                "cursor-pointer outline-none transition-transform duration-200 ease-out",
                "hover:scale-110",
                "focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-2",
                {
                  "ai-orb-core--thinking": orbState === "thinking",
                  "ai-orb-core--notification": orbState === "notification",
                  "ai-orb-core--celebration": orbState === "celebration",
                }
              )}
              aria-label="AI Mentor oeffnen"
            >
              {/* Icon */}
              <Sparkles className="h-7 w-7 text-white drop-shadow-sm" />

              {/* Status Dot (online) */}
              <span
                className={cn(
                  "absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white",
                  {
                    "bg-lr-green-400": !hasNotification,
                    "bg-lr-gold-500 ai-orb-notification-dot": hasNotification,
                  }
                )}
                aria-hidden="true"
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
