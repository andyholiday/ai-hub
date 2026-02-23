// =============================================================================
// Celebration Fireworks Component
// Enhanced particle explosion that triggers when the orb enters "celebration"
// state (e.g., after achievements). Particles burst outward, then fade away.
//
// Differences vs. old OrbParticles:
// - Radial burst animation (explode outward, not orbit)
// - More particles (12) with randomized trajectories
// - Sparkle trail effect
// - Gold shimmer after-glow
// =============================================================================

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PARTICLE_COUNT = 12;

const PARTICLE_COLORS = [
    "rgba(199, 168, 78, 1)",    // LR Gold
    "rgba(199, 168, 78, 0.8)",
    "rgba(0, 166, 81, 0.9)",    // LR Green
    "rgba(0, 166, 81, 0.7)",
    "rgba(239, 219, 158, 1)",   // Light Gold
    "rgba(150, 222, 184, 0.9)", // Light Green
    "rgba(255, 255, 255, 0.9)", // White sparkle
    "rgba(199, 168, 78, 0.9)",
    "rgba(0, 166, 81, 0.8)",
    "rgba(239, 219, 158, 0.8)",
    "rgba(255, 255, 255, 0.7)",
    "rgba(199, 168, 78, 0.85)",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FireworkParticle {
    id: number;
    color: string;
    size: number;
    angle: number;       // Burst direction in degrees
    distance: number;    // How far it travels
    duration: number;    // Flight time
    delay: number;       // Stagger
}

interface CelebrationFireworksProps {
    active: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CelebrationFireworks({ active }: CelebrationFireworksProps) {
    const particles = useMemo<FireworkParticle[]>(() => {
        return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
            id: i,
            color: PARTICLE_COLORS[i % PARTICLE_COLORS.length]!,
            size: 3 + Math.random() * 5,
            angle: (i / PARTICLE_COUNT) * 360 + (Math.random() - 0.5) * 30,
            distance: 60 + Math.random() * 50,
            duration: 0.8 + Math.random() * 0.6,
            delay: Math.random() * 0.15,
        }));
    }, []);

    return (
        <AnimatePresence>
            {active &&
                particles.map((p) => {
                    const endX = Math.cos((p.angle * Math.PI) / 180) * p.distance;
                    const endY = Math.sin((p.angle * Math.PI) / 180) * p.distance;

                    return (
                        <motion.span
                            key={p.id}
                            className="cosmos-firework-particle"
                            initial={{
                                opacity: 1,
                                scale: 0,
                                x: 0,
                                y: 0,
                            }}
                            animate={{
                                opacity: [1, 1, 0.8, 0],
                                scale: [0, 1.5, 1, 0.3],
                                x: [0, endX * 0.3, endX * 0.7, endX],
                                y: [0, endY * 0.3, endY * 0.7, endY],
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0,
                                transition: { duration: 0.2 },
                            }}
                            transition={{
                                duration: p.duration,
                                delay: p.delay,
                                repeat: Infinity,
                                repeatDelay: 0.5,
                                ease: [0.25, 0.46, 0.45, 0.94],
                            }}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: p.size,
                                height: p.size,
                                backgroundColor: p.color,
                                borderRadius: "50%",
                                boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                                marginTop: -(p.size / 2),
                                marginLeft: -(p.size / 2),
                                pointerEvents: "none",
                            }}
                            aria-hidden="true"
                        />
                    );
                })}
        </AnimatePresence>
    );
}
