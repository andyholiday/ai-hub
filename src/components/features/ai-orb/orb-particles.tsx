// =============================================================================
// Orb Particles Component
// Animated glowing dots that orbit the AI Orb during the "celebration" state.
// Uses Framer Motion for smooth entrance/exit and orbit animation.
// Respects prefers-reduced-motion via CSS (.ai-orb-particle is hidden).
// =============================================================================

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

/** Number of particles to render */
const PARTICLE_COUNT = 8;

/** Colors for the celebration particles (Gold + Green palette) */
const PARTICLE_COLORS = [
  "rgba(199, 168, 78, 0.9)", // Gold
  "rgba(199, 168, 78, 0.7)",
  "rgba(0, 166, 81, 0.8)", // Green
  "rgba(0, 166, 81, 0.6)",
  "rgba(239, 219, 158, 0.9)", // Light Gold
  "rgba(150, 222, 184, 0.8)", // Light Green
  "rgba(199, 168, 78, 0.85)",
  "rgba(0, 166, 81, 0.7)",
];

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ParticleConfig {
  id: number;
  color: string;
  size: number;
  orbitRadius: number;
  duration: number;
  delay: number;
  startAngle: number;
}

interface OrbParticlesProps {
  /** Whether to show the particles */
  active: boolean;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function OrbParticles({ active }: OrbParticlesProps) {
  // Generate stable particle configs (memoized so they don't re-create on each render)
  const particles = useMemo<ParticleConfig[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length] ?? "#ffffff",
      size: 3 + Math.random() * 4, // 3–7px
      orbitRadius: 36 + Math.random() * 20, // 36–56px from center
      duration: 1.8 + Math.random() * 1.4, // 1.8–3.2s per orbit
      delay: (i / PARTICLE_COUNT) * 0.6, // staggered entrance
      startAngle: (i / PARTICLE_COUNT) * 360, // evenly distributed
    }));
  }, []);

  return (
    <AnimatePresence>
      {active &&
        particles.map((p) => (
          <motion.span
            key={p.id}
            className="ai-orb-particle"
            initial={{
              opacity: 0,
              scale: 0,
              x: 0,
              y: 0,
            }}
            animate={{
              opacity: [0, 1, 1, 0.6, 1],
              scale: [0, 1, 1.2, 0.8, 1],
              x: [
                Math.cos((p.startAngle * Math.PI) / 180) * p.orbitRadius,
                Math.cos(((p.startAngle + 120) * Math.PI) / 180) *
                  p.orbitRadius,
                Math.cos(((p.startAngle + 240) * Math.PI) / 180) *
                  p.orbitRadius,
                Math.cos(((p.startAngle + 360) * Math.PI) / 180) *
                  p.orbitRadius,
              ],
              y: [
                Math.sin((p.startAngle * Math.PI) / 180) * p.orbitRadius,
                Math.sin(((p.startAngle + 120) * Math.PI) / 180) *
                  p.orbitRadius,
                Math.sin(((p.startAngle + 240) * Math.PI) / 180) *
                  p.orbitRadius,
                Math.sin(((p.startAngle + 360) * Math.PI) / 180) *
                  p.orbitRadius,
              ],
            }}
            exit={{
              opacity: 0,
              scale: 0,
              transition: { duration: 0.3, ease: "easeIn" },
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              top: "50%",
              left: "50%",
              marginTop: -(p.size / 2),
              marginLeft: -(p.size / 2),
            }}
            aria-hidden="true"
          />
        ))}
    </AnimatePresence>
  );
}
