// =============================================================================
// AI Orb Feature - Public API
// Re-exports all public components and hooks for the AI Orb feature.
// =============================================================================

// New Cosmos Companion (Phase A upgrade)
export { CosmosCompanion } from "./cosmos-companion";
export { ChatSplitView } from "./chat-split-view";
export { CelebrationFireworks } from "./celebration-fireworks";

// Legacy components (kept for backward compat)
export { AiOrb } from "./ai-orb";
export { ChatPanel } from "./chat-panel";
export { ChatMessage, TypingIndicator } from "./chat-message";

// Provider + hooks (shared)
export { OrbProvider, useOrb, ORB_STATE_LABELS } from "./orb-provider";
export { OrbParticles } from "./orb-particles";
export { useOrbPageState, OrbPageState } from "./use-orb-page-state";
export type { ChatMessage as ChatMessageType, OrbState, MessageRole } from "./orb-provider";
