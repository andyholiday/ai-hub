// =============================================================================
// AI Chat API Route
// POST /api/ai/chat
// Accepts messages, routes to the appropriate AI provider, and returns a
// streaming response.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAIRouter } from "@/lib/ai/router";
import type { AIProvider, ChatMessage } from "@/lib/ai/types";

// ---------------------------------------------------------------------------
// Request validation types
// ---------------------------------------------------------------------------

interface ChatRequestBody {
  messages: Array<{
    id?: string;
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  systemPrompt?: string;
  context?: Record<string, unknown>;
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // --- Auth check: Ensure the user is authenticated ---
    const { createServerClient } = await import("@supabase/ssr");
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // --- Parse and validate request body ---
    const body = (await req.json()) as ChatRequestBody;

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate each message
    for (const msg of body.messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          { error: "Each message must have a role and content" },
          { status: 400 }
        );
      }
      if (!["system", "user", "assistant"].includes(msg.role)) {
        return NextResponse.json(
          { error: `Invalid message role: "${msg.role}"` },
          { status: 400 }
        );
      }
    }

    // --- Build internal ChatMessage array ---
    const messages: ChatMessage[] = body.messages.map((m, i) => ({
      id: m.id || `msg-${Date.now()}-${i}`,
      role: m.role,
      content: m.content,
      timestamp: new Date(),
    }));

    const router = getAIRouter();

    // --- Streaming response ---
    if (body.stream !== false) {
      return handleStreamingResponse(router, {
        messages,
        systemPrompt: body.systemPrompt,
        context: body.context,
        provider: body.provider,
        model: body.model,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        stream: true,
      });
    }

    // --- Non-streaming response ---
    const result = await router.chat({
      messages,
      systemPrompt: body.systemPrompt,
      context: body.context,
      provider: body.provider,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      stream: false,
    });

    // Log token usage (preparation for ai_cost_log table)
    logTokenUsage(result.provider, result.model, result.usage);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[/api/ai/chat] Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = isRateLimitError(message) ? 429 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

// ---------------------------------------------------------------------------
// Streaming helpers
// ---------------------------------------------------------------------------

function handleStreamingResponse(
  router: ReturnType<typeof getAIRouter>,
  request: Parameters<ReturnType<typeof getAIRouter>["chatStream"]>[0]
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let totalTokens: number | undefined;
        let provider: string | undefined;
        let model: string | undefined;

        for await (const chunk of router.chatStream(request)) {
          // Send each chunk as a server-sent event
          const data = JSON.stringify({
            id: chunk.id,
            content: chunk.content,
            isComplete: chunk.isComplete,
            metadata: chunk.metadata,
          });

          controller.enqueue(
            encoder.encode(`data: ${data}\n\n`)
          );

          // Track final metadata for logging
          if (chunk.metadata) {
            if (chunk.metadata.tokensUsed !== undefined) {
              totalTokens = chunk.metadata.tokensUsed;
            }
            if (chunk.metadata.provider) {
              provider = chunk.metadata.provider;
            }
            if (chunk.metadata.model) {
              model = chunk.metadata.model;
            }
          }
        }

        // Log token usage after stream completes
        if (provider && model) {
          logTokenUsage(provider as AIProvider, model, {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: totalTokens ?? 0,
          });
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Stream error";
        const errorData = JSON.stringify({ error: message });
        controller.enqueue(
          encoder.encode(`data: ${errorData}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Log token usage for cost tracking.
 * This is a placeholder that writes to console; a future implementation
 * will insert into the ai_cost_log Supabase table.
 */
function logTokenUsage(
  provider: AIProvider | string,
  model: string,
  usage: { promptTokens: number; completionTokens: number; totalTokens: number }
): void {
  console.log("[AI Usage]", {
    provider,
    model,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    timestamp: new Date().toISOString(),
  });

  // TODO: Insert into Supabase ai_cost_log table
  // const supabase = createServerClient();
  // await supabase.from("ai_cost_log").insert({
  //   provider,
  //   model,
  //   prompt_tokens: usage.promptTokens,
  //   completion_tokens: usage.completionTokens,
  //   total_tokens: usage.totalTokens,
  //   estimated_cost: calculateCost(provider, model, usage),
  // });
}

/**
 * Simple heuristic to detect rate-limit errors from provider error messages.
 */
function isRateLimitError(message: string): boolean {
  const patterns = [
    "rate limit",
    "rate_limit",
    "too many requests",
    "quota exceeded",
    "429",
    "resource_exhausted",
  ];
  const lower = message.toLowerCase();
  return patterns.some((p) => lower.includes(p));
}
