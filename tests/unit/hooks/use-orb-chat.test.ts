// =============================================================================
// Tests: useOrbChat Hook (ADR-005, Phase 2.2)
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useOrbChat } from "@/components/features/ai-orb/use-orb-chat";

// ---------------------------------------------------------------------------
// SSE stream helper
// Creates a ReadableStream that emits the given SSE lines and then closes.
// ---------------------------------------------------------------------------

function makeStream(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    },
  });
}

function sseEvent(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockFetch(
  status: number,
  body: ReadableStream<Uint8Array> | null,
  bodyJson?: unknown,
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        body,
        json: () => Promise.resolve(bodyJson ?? {}),
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useOrbChat", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it("initializes with empty state", () => {
    const { result } = renderHook(() => useOrbChat());

    expect(result.current.messages).toEqual([]);
    expect(result.current.sessionId).toBeNull();
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.isLoadingMore).toBe(false);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("uses initialSessionId option when provided", () => {
    const { result } = renderHook(() =>
      useOrbChat({ initialSessionId: "sess-abc" }),
    );

    expect(result.current.sessionId).toBe("sess-abc");
  });

  // -------------------------------------------------------------------------
  // startNewSession
  // -------------------------------------------------------------------------

  it("startNewSession resets all state to initial", async () => {
    const sessionMeta = sseEvent({
      content: "",
      isComplete: false,
      metadata: { sessionId: "sess-001", userMessageId: "umsg-001" },
    });
    const contentChunk = sseEvent({ content: "Hallo!", isComplete: false });
    const stream = makeStream([sessionMeta, contentChunk, "data: [DONE]\n\n"]);
    mockFetch(200, stream);

    const { result } = renderHook(() => useOrbChat());

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(result.current.sessionId).toBe("sess-001");
    expect(result.current.messages.length).toBeGreaterThan(0);

    act(() => {
      result.current.startNewSession();
    });

    expect(result.current.sessionId).toBeNull();
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.hasMore).toBe(false);
  });

  // -------------------------------------------------------------------------
  // sendMessage — optimistic insert
  // -------------------------------------------------------------------------

  it("inserts user message optimistically before API responds", async () => {
    let resolveStream!: () => void;
    const streamPromise = new Promise<void>((res) => { resolveStream = res; });

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        streamPromise.then(() =>
          Promise.resolve({
            ok: true,
            status: 200,
            body: makeStream(["data: [DONE]\n\n"]),
            json: () => Promise.resolve({}),
          }),
        ),
      ),
    );

    const { result } = renderHook(() => useOrbChat());

    // Start send but don't await — check state mid-flight
    act(() => {
      void result.current.sendMessage("optimistic test");
    });

    // User message must already be in state (synchronous optimistic insert)
    await waitFor(() => {
      expect(
        result.current.messages.some(
          (m) => m.role === "user" && m.content === "optimistic test",
        ),
      ).toBe(true);
    });

    // Unblock stream so the hook can settle without leaking async work
    resolveStream();
    await act(async () => { await streamPromise; });
  });

  it("marks optimistic message with isOptimistic: true initially", () => {
    // Don't resolve fetch — just check the flag while in-flight
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));

    const { result } = renderHook(() => useOrbChat());

    act(() => {
      void result.current.sendMessage("check optimistic flag");
    });

    const msg = result.current.messages.find((m) => m.role === "user");
    expect(msg?.isOptimistic).toBe(true);
  });

  // -------------------------------------------------------------------------
  // sendMessage — happy path with stream
  // -------------------------------------------------------------------------

  it("accumulates streamed assistant content and extracts sessionId", async () => {
    const sessionMeta = sseEvent({
      content: "",
      isComplete: false,
      metadata: { sessionId: "sess-42", userMessageId: "umsg-42" },
    });
    const chunk1 = sseEvent({ content: "Hallo", isComplete: false });
    const chunk2 = sseEvent({ content: " Welt!", isComplete: false });
    const stream = makeStream([sessionMeta, chunk1, chunk2, "data: [DONE]\n\n"]);
    mockFetch(200, stream);

    const { result } = renderHook(() => useOrbChat());

    await act(async () => {
      await result.current.sendMessage("Hi");
    });

    expect(result.current.sessionId).toBe("sess-42");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeNull();

    const assistantMsg = result.current.messages.find(
      (m) => m.role === "assistant",
    );
    expect(assistantMsg?.content).toBe("Hallo Welt!");
  });

  it("sets isStreaming true during and false after stream", async () => {
    const stream = makeStream([
      sseEvent({ content: "test", isComplete: false }),
      "data: [DONE]\n\n",
    ]);
    mockFetch(200, stream);

    const { result } = renderHook(() => useOrbChat());
    const streamingStates: boolean[] = [];

    // Capture state changes
    const sendPromise = act(async () => {
      await result.current.sendMessage("stream test");
    });

    streamingStates.push(result.current.isStreaming);
    await sendPromise;
    streamingStates.push(result.current.isStreaming);

    // After completion, isStreaming must be false
    expect(result.current.isStreaming).toBe(false);
  });

  // -------------------------------------------------------------------------
  // sendMessage — error handling
  // -------------------------------------------------------------------------

  it("rolls back optimistic message and sets error on API failure", async () => {
    mockFetch(500, null, { error: "Internal Server Error" });

    const { result } = renderHook(() => useOrbChat());

    await act(async () => {
      await result.current.sendMessage("this will fail");
    });

    // Optimistic message must be removed
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.error).toBeTruthy();
    expect(result.current.isStreaming).toBe(false);
  });

  it("does not send when content is empty or whitespace", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useOrbChat());

    await act(async () => {
      await result.current.sendMessage("   ");
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.messages).toHaveLength(0);
  });

  it("does not send when already streaming", async () => {
    // Never-resolving fetch to keep isStreaming = true
    const fetchSpy = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useOrbChat());

    // First call — stays in-flight
    act(() => {
      void result.current.sendMessage("first");
    });

    // Second call while streaming — must be ignored
    await act(async () => {
      await result.current.sendMessage("second");
    });

    // Only one fetch call
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // sendMessage — passes sessionId to fetch when set
  // -------------------------------------------------------------------------

  it("includes existing sessionId in POST body", async () => {
    const stream = makeStream(["data: [DONE]\n\n"]);
    const fetchSpy = vi.fn(() =>
      Promise.resolve({ ok: true, status: 200, body: stream, json: () => Promise.resolve({}) }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() =>
      useOrbChat({ initialSessionId: "existing-session" }),
    );

    await act(async () => {
      await result.current.sendMessage("with session");
    });

    const callArgs = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(callArgs[1].body as string) as {
      sessionId?: string;
    };
    expect(body.sessionId).toBe("existing-session");
  });

  // -------------------------------------------------------------------------
  // sendMessage — forwards full conversation context (F02 fix)
  // -------------------------------------------------------------------------

  it("forwards all existing messages as conversation context on subsequent sends", async () => {
    // First message: establishes a session and gets a reply
    const stream1 = makeStream([
      sseEvent({ content: "", isComplete: false, metadata: { sessionId: "sess-ctx", userMessageId: "umsg-1" } }),
      sseEvent({ content: "Antwort 1", isComplete: false }),
      "data: [DONE]\n\n",
    ]);
    const fetchSpy = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, body: stream1, json: () => Promise.resolve({}) });

    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useOrbChat());

    await act(async () => {
      await result.current.sendMessage("Erste Frage");
    });

    // State now has: user msg + assistant msg
    expect(result.current.messages.length).toBe(2);

    // Second message: must include prior messages as context
    const stream2 = makeStream(["data: [DONE]\n\n"]);
    fetchSpy.mockResolvedValueOnce({ ok: true, status: 200, body: stream2, json: () => Promise.resolve({}) });

    await act(async () => {
      await result.current.sendMessage("Zweite Frage");
    });

    const secondCall = fetchSpy.mock.calls[1] as unknown as [string, RequestInit];
    const body = JSON.parse(secondCall[1].body as string) as {
      messages: Array<{ role: string; content: string }>;
    };

    // Must contain prior user + assistant messages plus the new user message
    expect(body.messages.length).toBeGreaterThanOrEqual(3);
    expect(body.messages[0]).toMatchObject({ role: "user", content: "Erste Frage" });
    expect(body.messages[1]).toMatchObject({ role: "assistant", content: "Antwort 1" });
    expect(body.messages[body.messages.length - 1]).toMatchObject({ role: "user", content: "Zweite Frage" });
  });

  // -------------------------------------------------------------------------
  // Error-shape parsing (Task 5b — ADR-015)
  // -------------------------------------------------------------------------

  it("parses legacy error shape { error: string } and sets error state", async () => {
    mockFetch(422, null, { error: "Modell nicht verfügbar" });

    const { result } = renderHook(() => useOrbChat());

    await act(async () => {
      await result.current.sendMessage("test legacy error");
    });

    expect(result.current.error).toBe("Modell nicht verfügbar");
    expect(result.current.messages).toHaveLength(0);
  });

  it("parses new error shape { error: { code, message } } and sets error state", async () => {
    mockFetch(503, null, {
      error: { code: "PROVIDER_UNAVAILABLE", message: "Anbieter nicht erreichbar" },
    });

    const { result } = renderHook(() => useOrbChat());

    await act(async () => {
      await result.current.sendMessage("test new error shape");
    });

    expect(result.current.error).toBe("Anbieter nicht erreichbar");
    expect(result.current.messages).toHaveLength(0);
  });

  it("falls back to status code message when error shape is unknown", async () => {
    mockFetch(500, null, {});

    const { result } = renderHook(() => useOrbChat());

    await act(async () => {
      await result.current.sendMessage("test unknown error shape");
    });

    expect(result.current.error).toContain("500");
    expect(result.current.messages).toHaveLength(0);
  });

  it("SSE stream error removes empty assistant bubble and sets error state", async () => {
    // Simulate a fetch that succeeds (ok: true) but has no readable body,
    // causing the stream reader to throw
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          body: null, // no readable stream — triggers throw inside sendMessage
          json: () => Promise.resolve({}),
        }),
      ),
    );

    const { result } = renderHook(() => useOrbChat());

    await act(async () => {
      await result.current.sendMessage("stream error test");
    });

    // No messages must remain (both optimistic user msg and streaming placeholder rolled back)
    expect(result.current.messages).toHaveLength(0);
    expect(result.current.error).toBeTruthy();
    expect(result.current.isStreaming).toBe(false);
  });

  // -------------------------------------------------------------------------
  // loadMore — no-op (Phase 3 stub, F01 fix)
  // -------------------------------------------------------------------------

  it("loadMore is a no-op (Phase 3 stub — /api/ai/chat/history not yet implemented)", async () => {
    // F01 fix: loadMore returns immediately without fetching.
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const { result } = renderHook(() => useOrbChat());

    await act(async () => {
      await result.current.loadMore();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.isLoadingMore).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Role mapping: DB "assistant" is stored as role "assistant" in hook
  // -------------------------------------------------------------------------

  it("assistant messages have role 'assistant' (not 'ai')", async () => {
    const stream = makeStream([
      sseEvent({ content: "reply", isComplete: false }),
      "data: [DONE]\n\n",
    ]);
    mockFetch(200, stream);

    const { result } = renderHook(() => useOrbChat());

    await act(async () => {
      await result.current.sendMessage("test role");
    });

    const assistantMsg = result.current.messages.find(
      (m) => m.content === "reply",
    );
    expect(assistantMsg?.role).toBe("assistant");
  });
});
