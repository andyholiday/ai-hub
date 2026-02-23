// =============================================================================
// Cosmos Companion – Next-Gen AI Orb
// A visually alive, multi-layered fluid orb that replaces the simple button.
//
// Features:
// - 120px multi-layer fluid blob with 3 morphing layers
// - Ambient page glow radiating onto the page edge
// - Drag-to-dock (4 corners)
// - Enhanced micro-reactions (scroll, clicks, keyboard)
// - Celebration fireworks with particle explosion
// - Split-view command center (50/50 instead of narrow panel)
// - Smooth expand/collapse with organic morph transition
// =============================================================================

"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils/cn";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useOrb, type OrbState } from "./orb-provider";
import { CelebrationFireworks } from "./celebration-fireworks";

// ---------------------------------------------------------------------------
// Lazy-load the SplitView ChatPanel
// ---------------------------------------------------------------------------
const ChatSplitView = dynamic(
    () => import("./chat-split-view").then((m) => m.ChatSplitView),
    { ssr: false },
);

// ---------------------------------------------------------------------------
// Dock positions
// ---------------------------------------------------------------------------
type DockPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

const DOCK_CLASSES: Record<DockPosition, string> = {
    "bottom-right": "fixed bottom-7 right-7",
    "bottom-left": "fixed bottom-7 left-7",
    "top-right": "fixed top-7 right-7",
    "top-left": "fixed top-7 left-7",
};

// ---------------------------------------------------------------------------
// Gradient map per state
// ---------------------------------------------------------------------------
const STATE_GRADIENT: Record<OrbState, string> = {
    idle: "from-lr-green-500/40 to-lr-gold-500/30",
    thinking: "from-lr-gold-400/50 to-lr-gold-600/40",
    notification: "from-lr-green-500/45 to-lr-gold-500/35",
    celebration: "from-lr-gold-400/50 to-lr-gold-500/40",
    greeting: "from-lr-gold-400/45 to-lr-gold-500/35",
    listening: "from-lr-green-400/40 to-lr-green-600/30",
    energized: "from-lr-green-400/45 to-lr-gold-400/35",
};

// ---------------------------------------------------------------------------
// Core gradient for center icon
// ---------------------------------------------------------------------------
const STATE_CORE_GRADIENT: Record<OrbState, string> = {
    idle: "from-lr-green-500 to-lr-gold-500",
    thinking: "from-lr-gold-400 to-lr-gold-600",
    notification: "from-lr-green-500 to-lr-gold-500",
    celebration: "from-lr-gold-400 to-lr-gold-500",
    greeting: "from-lr-gold-400 to-lr-gold-500",
    listening: "from-lr-green-400 to-lr-green-600",
    energized: "from-lr-green-400 to-lr-gold-400",
};

// ---------------------------------------------------------------------------
// Cosmos Companion Component
// ---------------------------------------------------------------------------
export function CosmosCompanion() {
    const pathname = usePathname();
    const {
        isExpanded,
        toggle,
        tooltipText,
        hasNotification,
        orbState,
    } = useOrb();

    const [isHovered, setIsHovered] = useState(false);
    const [dockPosition, setDockPosition] = useState<DockPosition>("bottom-right");
    const [isDragging, setIsDragging] = useState(false);
    const prevStateRef = useRef<OrbState>(orbState);

    // Track state changes for aria-live announcement
    const stateChanged = prevStateRef.current !== orbState;
    if (stateChanged) {
        prevStateRef.current = orbState;
    }

    const handleClick = useCallback(() => {
        if (!isDragging) {
            toggle();
        }
    }, [toggle, isDragging]);

    // Drag-to-dock handler
    const handleDragEnd = useCallback(
        (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            const { point } = info;
            const windowW = window.innerWidth;
            const windowH = window.innerHeight;

            const isRight = point.x > windowW / 2;
            const isBottom = point.y > windowH / 2;

            const newDock: DockPosition = `${isBottom ? "bottom" : "top"}-${isRight ? "right" : "left"}` as DockPosition;

            setDockPosition(newDock);
            // Prevent click from firing after drag
            setIsDragging(true);
            setTimeout(() => setIsDragging(false), 100);
        },
        [],
    );

    // Micro-reactions: subtle scale pulse on scroll
    const [scrollPulse, setScrollPulse] = useState(false);
    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        const handleScroll = () => {
            setScrollPulse(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setScrollPulse(false), 300);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => {
            window.removeEventListener("scroll", handleScroll);
            clearTimeout(timeout);
        };
    }, []);

    // Do not show the floating companion on the dedicated AI Mentor page
    if (pathname === "/ai-mentor") {
        return null;
    }

    return (
        <>
            {/* Accessibility: Announce orb state changes to screen readers */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
                {tooltipText}
            </div>

            {/* Split-View Chat Panel */}
            <AnimatePresence mode="wait">
                {isExpanded && <ChatSplitView key="chat-split" />}
            </AnimatePresence>

            {/* Cosmos Companion Orb */}
            <AnimatePresence>
                {!isExpanded && (
                    <motion.div
                        key="cosmos-companion"
                        drag
                        dragMomentum={false}
                        dragElastic={0.1}
                        onDragEnd={handleDragEnd}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{
                            scale: scrollPulse ? 0.95 : 1,
                            opacity: 1,
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25,
                        }}
                        className={cn(
                            DOCK_CLASSES[dockPosition],
                            "z-[9999] cursor-grab active:cursor-grabbing",
                        )}
                    >
                        {/* Ambient Page Glow */}
                        <div
                            className={cn(
                                "cosmos-ambient-glow pointer-events-none absolute inset-0",
                                "h-[200px] w-[200px] -translate-x-[40px] -translate-y-[40px]",
                                "rounded-full opacity-60 blur-[40px]",
                                "bg-gradient-to-br",
                                STATE_GRADIENT[orbState],
                            )}
                            aria-hidden="true"
                        />

                        {/* Tooltip */}
                        <AnimatePresence>
                            {isHovered && !isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                    transition={{ duration: 0.15, ease: "easeOut" }}
                                    className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap"
                                >
                                    <div className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium text-surface-700 shadow-elevated backdrop-blur-sm">
                                        {tooltipText}
                                    </div>
                                    <div className="mx-auto h-0 w-0 border-x-[6px] border-t-[6px] border-x-transparent border-t-white/90" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Celebration Fireworks */}
                        <CelebrationFireworks active={orbState === "celebration"} />

                        {/* Outer Rotating Ring */}
                        <div
                            className={cn(
                                "cosmos-ring pointer-events-none absolute inset-1/2",
                                "h-[140px] w-[140px] -translate-x-1/2 -translate-y-1/2 rounded-full",
                                "border border-lr-green-500/10",
                                orbState === "energized" && "cosmos-ring--fast",
                                orbState === "listening" && "cosmos-ring--slow",
                            )}
                            aria-hidden="true"
                        >
                            {/* Gold particle on ring */}
                            <span className="absolute -top-[3px] left-1/2 h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-lr-gold-500 shadow-lr-gold" />
                            {/* Green particle 120° offset */}
                            <span className="absolute -bottom-[3px] left-[20%] h-[5px] w-[5px] rounded-full bg-lr-green-500/60" />
                        </div>

                        {/* Second Ring (counter-rotating, dashed) */}
                        <div
                            className={cn(
                                "cosmos-ring-reverse pointer-events-none absolute inset-1/2",
                                "h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full",
                                "border border-dashed border-lr-gold-500/8",
                            )}
                            aria-hidden="true"
                        >
                            <span className="absolute -right-[2px] top-1/2 h-[4px] w-[4px] -translate-y-1/2 rounded-full bg-lr-gold-500/50" />
                        </div>

                        {/* Multi-Layer Fluid Blob Container */}
                        <button
                            type="button"
                            onClick={handleClick}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            className={cn(
                                "cosmos-orb-container group relative flex h-[120px] w-[120px] items-center justify-center",
                                "cursor-pointer outline-none",
                                "transition-transform duration-500 ease-out",
                                "hover:scale-105",
                                "focus-visible:ring-2 focus-visible:ring-lr-green-500 focus-visible:ring-offset-2",
                            )}
                            style={{ borderRadius: "50%" }}
                            aria-label="AI Mentor öffnen"
                        >
                            {/* Blob Layer 1 – Large, slow morph */}
                            <div
                                className={cn(
                                    "cosmos-blob cosmos-blob--1 absolute inset-0 rounded-[50%]",
                                    "bg-gradient-to-br from-lr-green-500/25 to-lr-green-600/15",
                                    "mix-blend-screen",
                                )}
                                aria-hidden="true"
                            />

                            {/* Blob Layer 2 – Medium, offset morph */}
                            <div
                                className={cn(
                                    "cosmos-blob cosmos-blob--2 absolute inset-[8px] rounded-[50%]",
                                    "bg-gradient-to-tr from-lr-green-400/20 to-lr-gold-500/15",
                                    "mix-blend-screen",
                                )}
                                aria-hidden="true"
                            />

                            {/* Blob Layer 3 – Inner, gold-accented morph */}
                            <div
                                className={cn(
                                    "cosmos-blob cosmos-blob--3 absolute inset-[18px] rounded-[50%]",
                                    "bg-gradient-to-bl from-lr-gold-500/20 to-lr-green-500/25",
                                    "mix-blend-screen",
                                )}
                                aria-hidden="true"
                            />

                            {/* Glassmorphism Center Core */}
                            <div
                                className={cn(
                                    "cosmos-core relative z-10 flex h-14 w-14 items-center justify-center rounded-full",
                                    "bg-gradient-to-br",
                                    STATE_CORE_GRADIENT[orbState],
                                    "shadow-lg backdrop-blur-sm",
                                )}
                            >
                                <Sparkles className="h-7 w-7 text-white drop-shadow-md" />
                            </div>

                            {/* Status Dot */}
                            <span
                                className={cn(
                                    "absolute right-[16px] top-[12px] z-20 h-3.5 w-3.5 rounded-full border-2 border-white",
                                    {
                                        "bg-lr-green-400": !hasNotification,
                                        "bg-lr-gold-500 cosmos-notification-dot": hasNotification,
                                    },
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
