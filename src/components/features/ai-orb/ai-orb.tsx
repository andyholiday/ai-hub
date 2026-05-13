// =============================================================================
// AI Orb Component ("Cosmos Orb" Variant)
// Persistent floating AI companion visible on every page.
//
// Features:
// - 64px round orb with context-dependent gradient (changes per state)
// - Breathing box-shadow animation (3s cycle, varies by state)
// - Rotating ring with gold particle (8s cycle, speed varies by state)
// - Status dot (online indicator)
// - Hover: scale 1.1 + tooltip with pill shape (state-aware text)
// - Click: toggles the chat panel
// - Celebration particles (orbiting glowing dots)
// - aria-live region for state announcements
// - Respects prefers-reduced-motion
// =============================================================================

"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils/cn";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useOrb, type OrbState } from "./orb-provider";
import { OrbParticles } from "./orb-particles";
import { OrbAnimationLayer } from "./orb-animation-layer";
import { useOrbIdleState } from "./use-orb-idle-state";
import { WanderLayer } from "./wander-layer";
import { getFeature } from "@/lib/features/feature-registry";

// ---------------------------------------------------------------------------
// Lazy-load the ChatPanel (heavy: framer-motion animations, date-fns, icons).
// Only loaded when the user expands the orb. SSR disabled (client overlay).
// ---------------------------------------------------------------------------
const ChatPanel = dynamic(
  () => import("./chat-panel").then((m) => m.ChatPanel),
  { ssr: false },
);

// -----------------------------------------------------------------------------
// Gradient map per state -- determines the orb's visual color identity
// -----------------------------------------------------------------------------

const STATE_GRADIENT: Record<OrbState, string> = {
  idle: "from-brand-primary-500 to-brand-accent-500",
  thinking: "from-brand-accent-400 to-brand-accent-600",
  notification: "from-brand-primary-500 to-brand-accent-500",
  celebration: "from-brand-accent-400 to-brand-accent-500",
  greeting: "from-brand-accent-400 to-brand-accent-500",
  listening: "from-brand-primary-400 to-brand-primary-600",
  energized: "from-brand-primary-400 to-brand-accent-400",
};

// -----------------------------------------------------------------------------
// CSS class map for core animation per state
// -----------------------------------------------------------------------------

const STATE_CORE_CLASS: Record<OrbState, string> = {
  idle: "",
  thinking: "ai-orb-core--thinking",
  notification: "ai-orb-core--notification",
  celebration: "ai-orb-core--celebration",
  greeting: "ai-orb-core--greeting",
  listening: "ai-orb-core--listening",
  energized: "ai-orb-core--energized",
};

// -----------------------------------------------------------------------------
// Ring modifier class per state
// -----------------------------------------------------------------------------

const STATE_RING_CLASS: Record<OrbState, string> = {
  idle: "",
  thinking: "ai-orb-ring--paused",
  notification: "",
  celebration: "",
  greeting: "",
  listening: "ai-orb-ring--listening",
  energized: "ai-orb-ring--energized",
};

// ADR-015 Schicht 1: Puls-CSS-Klasse pro State (ai-orb fallback variant)
const STATE_PULSE_CLASS: Record<OrbState, string> = {
  idle: "",
  thinking: "ai-orb-core--thinking",
  listening: "ai-orb-core--listening",
  energized: "ai-orb-core--energized",
  notification: "ai-orb-core--notification",
  celebration: "ai-orb-core--celebration",
  greeting: "ai-orb-core--greeting",
};

// -----------------------------------------------------------------------------
// Feature flag — evaluated once at module load (opt-in, defaultEnabled: false)
// -----------------------------------------------------------------------------

const ORB_WANDER_ENABLED = getFeature('orb-wander').defaultEnabled;

// -----------------------------------------------------------------------------
// Orb inner content — shared between wander and static layouts
// -----------------------------------------------------------------------------

interface OrbContentProps {
  isHovered: boolean;
  isExpanded: boolean;
  tooltipText: string;
  orbState: OrbState;
  hasNotification: boolean;
  handleClick: () => void;
  setIsHovered: (v: boolean) => void;
}

function OrbContent({
  isHovered,
  isExpanded,
  tooltipText,
  orbState,
  hasNotification,
  handleClick,
  setIsHovered,
}: OrbContentProps) {
  return (
    <>
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

      {/* Celebration Particles */}
      <OrbParticles active={orbState === "celebration"} />

      {/* Rotating Ring */}
      <div
        className={cn(
          "ai-orb-ring pointer-events-none absolute inset-1/2 h-[88px] w-[88px] -translate-x-1/2 -translate-y-1/2 rounded-full",
          "border border-brand-primary-500/15",
          STATE_RING_CLASS[orbState]
        )}
        aria-hidden="true"
      >
        {/* Gold Particle on the ring */}
        <span className="absolute -top-[3px] left-1/2 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-brand-accent-500 shadow-brand-accent" />
      </div>

      {/* Orb Button */}
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "ai-orb-core group relative flex h-16 w-16 items-center justify-center rounded-full",
          "bg-gradient-to-br",
          STATE_GRADIENT[orbState],
          "cursor-pointer outline-none transition-all duration-500 ease-out",
          "hover:scale-110",
          "focus-visible:ring-2 focus-visible:ring-brand-primary-500 focus-visible:ring-offset-2",
          STATE_CORE_CLASS[orbState],
          STATE_PULSE_CLASS[orbState],
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
              "bg-brand-primary-400": !hasNotification,
              "bg-brand-accent-500 ai-orb-notification-dot": hasNotification,
            }
          )}
          aria-hidden="true"
        />
      </button>
    </>
  );
}

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
  const prevStateRef = useRef<OrbState>(orbState);

  // Feature-Flag: orb-idle-state (opt-in, defaultEnabled: true)
  const idleFeature = getFeature('orb-idle-state');
  const idleEnabled = idleFeature.defaultEnabled;
  const { state: idleState } = useOrbIdleState();

  // Track state changes for aria-live announcement
  const stateChanged = prevStateRef.current !== orbState;
  if (stateChanged) {
    prevStateRef.current = orbState;
  }

  const handleClick = useCallback(() => {
    toggle();
  }, [toggle]);

  const orbContentProps: OrbContentProps = {
    isHovered,
    isExpanded,
    tooltipText,
    orbState,
    hasNotification,
    handleClick,
    setIsHovered,
  };

  return (
    <>
      {/* ----------------------------------------------------------------- */}
      {/* Accessibility: Announce orb state changes to screen readers       */}
      {/* ----------------------------------------------------------------- */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {tooltipText}
      </div>

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
          ORB_WANDER_ENABLED ? (
            // Wander mode: WanderLayer controls position via motion values
            <WanderLayer key="ai-orb">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <OrbContent {...orbContentProps} />
              </motion.div>
            </WanderLayer>
          ) : (
            // Static mode: fixed bottom-right (original behaviour)
            <motion.div
              key="ai-orb"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-7 right-7 z-[9999]"
            >
              <OrbAnimationLayer idleState={idleEnabled ? idleState : 'active'}>
                <OrbContent {...orbContentProps} />
              </OrbAnimationLayer>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </>
  );
}
