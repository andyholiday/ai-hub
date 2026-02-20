// =============================================================================
// AI Orb Feature - Public API
// Re-exports all public components and hooks for the AI Orb feature.
// =============================================================================

export { AiOrb } from "./ai-orb";
export { ChatPanel } from "./chat-panel";
export { ChatMessage, TypingIndicator } from "./chat-message";
export { OrbProvider, useOrb } from "./orb-provider";
export type { ChatMessage as ChatMessageType, OrbState, MessageRole } from "./orb-provider";
