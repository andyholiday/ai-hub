// =============================================================================
// OpenRouter Provider
// OpenRouter is OpenAI-API compatible — we extend OpenAIProvider and override
// only the endpoint, identity, and headers.
// =============================================================================

import type { AIProvider } from "../types";
import { OpenAIProvider } from "./openai";

export class OpenRouterProvider extends OpenAIProvider {
  readonly provider: AIProvider = "openrouter";
  readonly name: string = "OpenRouter";

  protected get baseUrl(): string {
    return this.config.baseUrl || "https://openrouter.ai/api";
  }

  protected getHeaders(): Record<string, string> {
    const referer = process.env.NEXT_PUBLIC_APP_URL || "https://ai-hub.local";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      "HTTP-Referer": referer,
      "X-Title": "ai-hub",
    };
  }
}
