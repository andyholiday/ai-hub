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
import { motion, type MotionProps } from 'framer-motion';

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
        animate: { scale: [1.0, 1.04, 1.0] },
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      };

    case 'idle.mini':
      return {
        animate: { y: [0, -4, 0, 4, 0] },
        transition: {
          duration: 2,
          ease: 'easeInOut',
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
  const animationConfig = useMemo(
    () => buildAnimationConfig(idleState),
    [idleState],
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
