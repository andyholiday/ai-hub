// =============================================================================
// useOrbPageState Hook
// Sets the AI Orb to a specific state when the component mounts and
// optionally resets it on unmount. Designed for page-level integration.
//
// Usage:
//   <OrbPageState state="listening" />   // renders nothing, just sets state
// =============================================================================

"use client";

import { useEffect } from "react";
import { useOrb, type OrbState } from "./orb-provider";

// -----------------------------------------------------------------------------
// Hook
// -----------------------------------------------------------------------------

/**
 * Sets the orb state on mount and resets to idle on unmount.
 * Use this in client components that represent specific page contexts.
 */
export function useOrbPageState(state: OrbState): void {
  const { setOrbState } = useOrb();

  useEffect(() => {
    setOrbState(state);

    return () => {
      setOrbState("idle");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only fire on mount/unmount
  }, []);
}

// -----------------------------------------------------------------------------
// Headless Component (for use in server component pages via composition)
// -----------------------------------------------------------------------------

interface OrbPageStateProps {
  /** The orb state to activate while this component is mounted */
  state: OrbState;
}

/**
 * Invisible client component that sets the orb state while mounted.
 * Use this inside server component pages:
 *
 *   import { OrbPageState } from "@/components/features/ai-orb/use-orb-page-state";
 *   <OrbPageState state="greeting" />
 */
export function OrbPageState({ state }: OrbPageStateProps) {
  useOrbPageState(state);
  return null;
}
