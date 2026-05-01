// =============================================================================
// useOrbChat — Chat-Session-Persistenz (ADR-005, Phase 2.2)
//
// Kapselt den gesamten Nachrichten-Lebenszyklus:
//   - Optimistic Insert (user-Message sofort sichtbar)
//   - POST /api/ai/chat mit optionaler sessionId
//   - ID-Reconciliation nach Stream-Ende
//   - Cursor-basierte Pagination (50 Messages / Seite)
//
// NICHT in scope:
//   - Supabase Realtime-Sync (Future Work)
//   - localStorage-Session-Bindung (Future Work)
// =============================================================================

"use client";

import { useCallback, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// Types (lokale UI-Types — getrennt vom DB-Schema)
// ---------------------------------------------------------------------------

export interface ChatMessage {
  /** Temporaere ID ("msg-{ts}-{rand}") oder DB-UUID nach Reconciliation */
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** true waehrend DB-Confirm noch aussteht */
  isOptimistic?: boolean;
}

export interface UseOrbChatOptions {
  /** Z.B. aus URL-Query-Param — laedt diese Session beim Mount */
  initialSessionId?: string;
}

export interface UseOrbChatReturn {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoadingMore: boolean;
  hasMore: boolean;
  sendMessage: (content: string) => Promise<void>;
  loadMore: () => Promise<void>;
  startNewSession: () => void;
  isStreaming: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeTempId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useOrbChat(options?: UseOrbChatOptions): UseOrbChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(
    options?.initialSessionId ?? null
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cursor fuer Pagination: created_at des aeltesten geladenen Eintrags
  const oldestTimestampRef = useRef<string | null>(null);

  // ---------------------------------------------------------------------------
  // loadMore — laedt aeltere Nachrichten (Seite 2+)
  // ---------------------------------------------------------------------------

  const loadMore = useCallback(async () => {
    if (!sessionId || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams({
        sessionId,
        limit: String(DEFAULT_PAGE_SIZE),
      });
      if (oldestTimestampRef.current) {
        params.set("before", oldestTimestampRef.current);
      }

      const res = await fetch(`/api/ai/chat/history?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Fehler beim Laden: ${res.status}`);
      }

      const json = (await res.json()) as {
        messages: Array<{
          id: string;
          role: "user" | "assistant" | "system";
          content: string;
          created_at: string;
        }>;
        hasMore: boolean;
      };

      const older: ChatMessage[] = json.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.created_at),
        }));

      if (older.length > 0) {
        const oldest = older[0];
        if (oldest) {
          oldestTimestampRef.current = oldest.timestamp.toISOString();
        }
        setMessages((prev) => [...older, ...prev]);
      }
      setHasMore(json.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setIsLoadingMore(false);
    }
  }, [sessionId, isLoadingMore, hasMore]);

  // ---------------------------------------------------------------------------
  // sendMessage — Hauptflow (Optimistic UI + Stream + Reconciliation)
  // ---------------------------------------------------------------------------

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      setError(null);

      // 1. Optimistisch einfuegen
      const tempId = makeTempId();
      const optimisticMsg: ChatMessage = {
        id: tempId,
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
        isOptimistic: true,
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      setIsStreaming(true);

      // Streaming-Nachricht vorbereiten (leer, wird befuellt)
      const streamTempId = makeTempId();
      const streamingMsg: ChatMessage = {
        id: streamTempId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: content.trim() }],
            sessionId: sessionId ?? undefined,
            stream: true,
          }),
        });

        if (!res.ok) {
          const errJson = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(errJson.error ?? `API-Fehler: ${res.status}`);
        }

        // Optimistic-ID als bestaetigt markieren (entfernt isOptimistic-Flag)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, isOptimistic: false } : m
          )
        );

        // Streaming-Placeholder einfuegen
        setMessages((prev) => [...prev, streamingMsg]);

        // Stream lesen
        const reader = res.body?.getReader();
        if (!reader) throw new Error("Kein ReadableStream");

        const decoder = new TextDecoder();
        let buffer = "";
        let newSessionId: string | null = null;
        let userDbId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") break;

            try {
              const chunk = JSON.parse(raw) as {
                content?: string;
                isComplete?: boolean;
                metadata?: {
                  sessionId?: string;
                  userMessageId?: string;
                };
              };

              if (chunk.metadata?.sessionId && !newSessionId) {
                newSessionId = chunk.metadata.sessionId;
                setSessionId(newSessionId);
              }
              if (chunk.metadata?.userMessageId && !userDbId) {
                userDbId = chunk.metadata.userMessageId;
              }

              if (chunk.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === streamTempId
                      ? { ...m, content: m.content + chunk.content }
                      : m
                  )
                );
              }
            } catch {
              // Unvollstaendiger JSON-Chunk — uebergehen
            }
          }
        }

        // ID-Reconciliation: user-Message tempId → DB-ID
        if (userDbId) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: userDbId! } : m))
          );
        }
      } catch (err) {
        // Rollback: optimistic user-Message entfernen, streaming-Placeholder entfernen
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempId && m.id !== streamTempId)
        );
        setError(err instanceof Error ? err.message : "Nachricht fehlgeschlagen");
      } finally {
        setIsStreaming(false);
      }
    },
    [sessionId, isStreaming]
  );

  // ---------------------------------------------------------------------------
  // startNewSession
  // ---------------------------------------------------------------------------

  const startNewSession = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setHasMore(false);
    setError(null);
    oldestTimestampRef.current = null;
  }, []);

  return {
    messages,
    sessionId,
    isLoadingMore,
    hasMore,
    sendMessage,
    loadMore,
    startNewSession,
    isStreaming,
    error,
  };
}
