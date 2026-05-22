'use client';

// =============================================================================
// OrbAnimationLayer — Framer Motion Wrapper fuer Idle-Animationen (P3.3)
//
// Reagiert auf den State aus useOrbIdleState und wendet je State eine
// eigene animate-Konfiguration an.
//
// States:
//   idle.breathing  — scale-Loop 1.0→1.04→1.0 (3s)
//   idle.mini       — leichter y-Drift
//   idle.maxi       — Easter-Egg: kurzer Spin (rotate 360°)
//   muted           — keine Animation, statisch
//   active          — keine Idle-Animation
// =============================================================================

import { useMemo } from 'react';
import { motion, useReducedMotion, type MotionProps } from 'framer-motion';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrbAnimationLayerProps {
  /** Aktueller State-Value aus useOrbIdleState (z.B. 'idle.breathing'). */
  idleState: string;
  children: React.ReactNode;
  className?: string;
}

// ---------------------------------------------------------------------------
// Animation-Config-Map (useMemo-stabil)
// ---------------------------------------------------------------------------

type AnimationConfig = Pick<MotionProps, 'animate' | 'transition'>;

function buildAnimationConfig(idleState: string): AnimationConfig {
  switch (idleState) {
    case 'idle.breathing':
      return {
        // 8% scale loop — visible on a 120px orb (~10px difference) but still calm.
        // Times keyframes pinned so framer-motion doesn't drop the cycle on
        // animate-prop identity changes during React re-renders.
        animate: { scale: [1.0, 1.08, 1.0] },
        transition: {
          duration: 2.8,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'easeInOut',
          times: [0, 0.5, 1],
        },
      };

    case 'idle.mini':
      return {
        animate: { y: [0, -10, 0, 10, 0] },
        transition: {
          duration: 2,
          ease: 'easeInOut',
          times: [0, 0.25, 0.5, 0.75, 1],
        },
      };

    case 'idle.maxi':
      return {
        animate: { rotate: [0, 360] },
        transition: {
          duration: 4,
          ease: 'easeInOut',
        },
      };

    case 'muted':
      return {
        animate: { scale: 1, y: 0, rotate: 0 },
        transition: { duration: 0.3 },
      };

    default:
      // active und unbekannte States: keine Idle-Animation
      return {
        animate: { scale: 1, y: 0, rotate: 0 },
        transition: { duration: 0.3 },
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OrbAnimationLayer({
  idleState,
  children,
  className,
}: OrbAnimationLayerProps) {
  const prefersReducedMotion = useReducedMotion();

  const animationConfig = useMemo(
    () => {
      if (prefersReducedMotion) {
        // Reduced-motion: static, no looping or transform animations.
        return {
          animate: { scale: 1, y: 0, rotate: 0 },
          transition: { duration: 0 },
        } satisfies AnimationConfig;
      }
      return buildAnimationConfig(idleState);
    },
    [idleState, prefersReducedMotion],
  );

  return (
    <motion.div
      className={className}
      animate={animationConfig.animate}
      transition={animationConfig.transition}
    >
      {children}
    </motion.div>
  );
}
