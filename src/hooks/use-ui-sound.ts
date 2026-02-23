"use client";

// =============================================================================
// UI Sound Hook
// Generates soft, modern UI notification sounds using the native Web Audio API.
// Zero dependencies, 0 KB bundle size, no external assets required.
// =============================================================================

import { useCallback } from "react";

export function useUiSound() {
    const playSuccessChime = useCallback(() => {
        try {
            // AudioContext creation ensures we only play if the browser supports it
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;

            const ctx = new AudioCtx();

            // We use two oscillators to create a slightly richer "bell" / chime sound
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc1.type = "sine";
            osc2.type = "sine";

            // Start at E5 (659.25 Hz) and quickly pitch up to A5 (880 Hz)
            osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.08);

            // Second oscillator adds a harmony (C#6)
            osc2.frequency.setValueAtTime(1108.73, ctx.currentTime);

            // Envelope: Fast attack, slow decay
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc1.start(ctx.currentTime);
            osc2.start(ctx.currentTime);

            osc1.stop(ctx.currentTime + 0.6);
            osc2.stop(ctx.currentTime + 0.6);

            // Clean up context after sound finishes to free memory
            setTimeout(() => {
                if (ctx.state !== "closed") {
                    ctx.close();
                }
            }, 1000);

        } catch (e) {
            // Silently fail if auto-play is blocked or AudioContext is unavailable
        }
    }, []);

    return { playSuccessChime };
}
