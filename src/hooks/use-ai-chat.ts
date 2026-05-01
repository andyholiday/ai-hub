// =============================================================================
// useAiChat React Hook
// Manages chat state, streaming, and communication with the AI Chat API route
// =============================================================================

"use client";

import { useCallback, useRef, useState } from "react";
import type { AIProvider } from "@/lib/ai/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    provider?: string;
    model?: string;
    tokensUsed?: number;
    latencyMs?: number;
  };
}

export interface UseAiChatOptions {
  /** Preferred AI provider */
  provider?: AIProvider;
  /** Preferred model override */
  model?: string;
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** Max tokens for the response */
  maxTokens?: number;
  /** Additional context passed to the API */
  context?: Record<string, unknown>;
  /** Initial messages to populate the chat */
  initialMessages?: ChatMessage[];
  /** Callback when a complete response is received */
  onResponse?: (message: ChatMessage) => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
}

export interface UseAiChatReturn {
  /** Current list of chat messages */
  messages: ChatMessage[];
  /** Whether a request is currently in progress */
  isLoading: boolean;
  /** The current error, if any */
  error: Error | null;
  /** Send a user message and receive a streaming AI response */
  sendMessage: (content: string) => Promise<void>;
  /** Clear all messages */
  clearMessages: () => void;
  /** Reset the entire chat state (messages, error, loading) */
  resetChat: () => void;
  /** Abort the current streaming request */
  abort: () => void;
}

// ---------------------------------------------------------------------------
// Hook Implementation
// ---------------------------------------------------------------------------

export function useAiChat(options: UseAiChatOptions = {}): UseAiChatReturn {
  const {
    provider,
    model,
    temperature,
    maxTokens,
    context,
    initialMessages = [],
    onResponse,
    onError,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // AbortController ref to cancel in-flight requests
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Generate a unique message ID.
   */
  const generateId = useCallback((): string => {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }, []);

  /**
   * Send a user message and process the streamed AI response.
   */
  const sendMessage = useCallback(
    async (content: string): Promise<void> => {
      if (!content.trim()) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setError(null);
      setIsLoading(true);

      // Create the user message
      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      // Create a placeholder for the assistant response
      const assistantId = generateId();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      // Optimistically add both messages
      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      try {
        // Build the messages payload (include history + new user message)
        const allMessages = [...messages, userMessage];

        const apiMessages = allMessages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }));

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiMessages,
            context,
            provider,
            model,
            temperature,
            maxTokens,
            stream: true,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          const errorMsg =
            (errorData as { error?: string } | null)?.error ||
            `Request failed with status ${response.status}`;
          throw new Error(errorMsg);
        }

        if (!response.body) {
          throw new Error("Response has no body for streaming");
        }

        // --- Process the SSE stream ---
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let lastMetadata: ChatMessage["metadata"] | undefined;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data: ")) continue;

              const jsonStr = trimmed.slice(6);
              if (jsonStr === "[DONE]") continue;

              try {
                const chunk = JSON.parse(jsonStr) as {
                  content?: string;
                  isComplete?: boolean;
                  error?: string;
                  metadata?: ChatMessage["metadata"];
                };

                // Handle server-side errors sent via the stream
                if (chunk.error) {
                  throw new Error(chunk.error);
                }

                if (chunk.content) {
                  fullContent += chunk.content;

                  // Update the assistant message in-place for live rendering
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent }
                        : m
                    )
                  );
                }

                if (chunk.metadata) {
                  lastMetadata = {
                    ...lastMetadata,
                    ...chunk.metadata,
                  };
                }
              } catch (parseError) {
                // If it is a rethrown Error from chunk.error, propagate it
                if (parseError instanceof Error && parseError.message !== "Unexpected token") {
                  throw parseError;
                }
                // Otherwise skip malformed JSON
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Finalize the assistant message with metadata
        const finalMessage: ChatMessage = {
          id: assistantId,
          role: "assistant",
          content: fullContent,
          timestamp: new Date(),
          metadata: lastMetadata,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? finalMessage : m))
        );

        onResponse?.(finalMessage);
      } catch (err) {
        // Ignore aborted requests
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        const chatError =
          err instanceof Error ? err : new Error(String(err));
        setError(chatError);

        // Remove the empty assistant placeholder on error
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantId)
        );

        onError?.(chatError);
      } finally {
        setIsLoading(false);

        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [
      messages,
      generateId,
      context,
      provider,
      model,
      temperature,
      maxTokens,
      onResponse,
      onError,
    ]
  );

  /**
   * Clear all messages.
   */
  const clearMessages = useCallback((): void => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Reset the entire chat state.
   */
  const resetChat = useCallback((): void => {
    abortRef.current?.abort();
    setMessages(initialMessages);
    setIsLoading(false);
    setError(null);
  }, [initialMessages]);

  /**
   * Abort the current streaming request.
   */
  const abort = useCallback((): void => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    resetChat,
    abort,
  };
}
