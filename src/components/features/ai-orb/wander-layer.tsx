'use client';

// =============================================================================
// WanderLayer — Wraps the Orb in a scroll-coupled motion container
// Pattern P3.1, ADR-007
//
// Props:
//   children — the Orb element (rendered inside the motion.div)
//
// The component is position:fixed so it does not cause layout shift.
// aria-hidden="true" because the orb itself carries its own accessible label.
// Viewport clamping is applied inside useOrbWander.
// =============================================================================

import { motion } from 'framer-motion';
import { useOrbWander } from './use-orb-wander';

interface WanderLayerProps {
  children: React.ReactNode;
}

export function WanderLayer({ children }: WanderLayerProps) {
  const { x, y } = useOrbWander();

  return (
    <motion.div
      style={{ x, y, position: 'fixed', top: 0, left: 0, zIndex: 9999 }}
      aria-hidden="true"
    >
      {children}
    </motion.div>
  );
}
