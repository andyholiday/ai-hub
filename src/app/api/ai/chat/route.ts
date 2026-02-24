// =============================================================================
// AI Chat API Route
// POST /api/ai/chat
// Accepts messages, routes to the appropriate AI provider, and returns a
// streaming response.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { type AIRouter, getAIRouterWithDBKeys } from "@/lib/ai/router";
import { requireAuth } from "@/lib/api/require-auth";
import { rateLimit, rateLimitHeaders } from "@/lib/api/rate-limit";
import type { AIProvider, ChatMessage } from "@/lib/ai/types";

export const dynamic = 'force-dynamic';

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
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;
    const { userId } = auth;

    // --- Rate limiting ---
    const rl = await rateLimit(req, "ai", userId);
    if (!rl.success) {
      return NextResponse.json(
        { data: null, error: { code: "RATE_LIMITED", message: "Rate limit exceeded. Please try again later." } },
        { status: 429, headers: rateLimitHeaders(rl) },
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

    const router = await getAIRouterWithDBKeys();

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
      }, userId);
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

    // Log token usage into ai_cost_log (fire-and-forget)
    logTokenUsage(result.provider, result.model, result.usage, userId);

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
  router: AIRouter,
  request: Parameters<AIRouter["chatStream"]>[0],
  userId: string,
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

        // Log token usage after stream completes (fire-and-forget)
        if (provider && model) {
          logTokenUsage(provider as AIProvider, model, {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: totalTokens ?? 0,
          }, userId);
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
 * Approximate cost per 1K tokens by provider key.
 */
const COST_PER_1K: Record<string, { input: number; output: number }> = {
  gemini: { input: 0.00025, output: 0.0005 },
  openai: { input: 0.0005, output: 0.0015 },
  claude: { input: 0.003, output: 0.015 },
  copilot: { input: 0.001, output: 0.002 },
};

/**
 * Log token usage into the ai_cost_log Supabase table.
 *
 * This is intentionally fire-and-forget: we do NOT await the result so the
 * chat response is never delayed by cost logging. Errors are caught and
 * logged to the console but never propagated.
 */
function logTokenUsage(
  provider: AIProvider | string,
  _model: string,
  usage: { promptTokens: number; completionTokens: number; totalTokens: number },
  userId?: string,
): void {
  // Fire-and-forget -- the IIFE is intentionally not awaited.
  void (async () => {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      const supabase = createAdminClient();

      // --- Look up the provider_id from ai_providers ---
      const providerKey = typeof provider === "string" ? provider : provider;
      const { data: providerRow, error: providerError } = await supabase
        .from("ai_providers")
        .select("id")
        .eq("provider_key", providerKey)
        .single();

      if (providerError || !providerRow) {
        console.warn(
          `[logTokenUsage] Provider "${providerKey}" not found in ai_providers – skipping cost log.`,
        );
        return;
      }

      // --- Calculate estimated cost ---
      const rates = COST_PER_1K[providerKey] ?? { input: 0, output: 0 };
      const estimatedCost =
        (usage.promptTokens / 1000) * rates.input +
        (usage.completionTokens / 1000) * rates.output;

      // --- Insert cost log row ---
      const { error: insertError } = await supabase
        .from("ai_cost_log")
        .insert({
          provider_id: providerRow.id,
          feature: "mentor_chat" as const,
          tokens_input: usage.promptTokens,
          tokens_output: usage.completionTokens,
          estimated_cost: Math.round(estimatedCost * 1_000_000) / 1_000_000,
          user_id: userId ?? null,
        });

      if (insertError) {
        console.error("[logTokenUsage] Insert failed:", insertError.message);
      }
    } catch (err) {
      console.error("[logTokenUsage] Unexpected error:", err);
    }
  })();
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
