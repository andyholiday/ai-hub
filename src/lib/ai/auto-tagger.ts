// =============================================================================
// Auto-Tagging Service
// Uses the existing AI Router to suggest tags for content based on
// title and description analysis.
// =============================================================================

import { getAIRouter } from "./router";
import type { ChatMessage } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TagSuggestion {
  /** The suggested tag string. */
  tag: string;
  /** Confidence score from 0.0 to 1.0. */
  confidence: number;
  /** Optional category the tag belongs to. */
  category?: string;
}

export interface AutoTagRequest {
  title: string;
  description: string;
  existingTags?: string[];
  maxSuggestions?: number;
}

export interface AutoTagResult {
  suggestions: TagSuggestion[];
  provider: string;
  model: string;
}

// ---------------------------------------------------------------------------
// Known categories and common tags for the AI Hub platform
// ---------------------------------------------------------------------------

const KNOWN_CATEGORIES = [
  "prompt_engineering",
  "ai_tools",
  "automation",
  "data_analysis",
  "ai_ethics",
  "other",
] as const;

const COMMON_TAGS = [
  "ChatGPT",
  "Claude",
  "Gemini",
  "Copilot",
  "Midjourney",
  "DALL-E",
  "Stable Diffusion",
  "Prompt Engineering",
  "Chain of Thought",
  "Few-Shot",
  "Zero-Shot",
  "RAG",
  "Fine-Tuning",
  "Automatisierung",
  "Social Media",
  "Content Creation",
  "Produktberatung",
  "Teamfuehrung",
  "Datenanalyse",
  "Kundenservice",
  "Marketing",
  "Vertrieb",
  "Community",
  "Anfaenger",
  "Fortgeschritten",
  "Experte",
];

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------

function buildAutoTagSystemPrompt(existingTags?: string[]): string {
  const tagList = existingTags?.length
    ? `\n\nBereits verwendete Tags auf der Plattform:\n${existingTags.join(", ")}`
    : `\n\nHaeufig verwendete Tags:\n${COMMON_TAGS.join(", ")}`;

  return `Du bist ein intelligenter Auto-Tagging-Assistent fuer die AI Hub Plattform.
Deine Aufgabe ist es, passende Tags fuer Best-Practice-Beitraege vorzuschlagen.

Verfuegbare Kategorien: ${KNOWN_CATEGORIES.join(", ")}
${tagList}

Regeln:
- Schlage zwischen 3 und 10 Tags vor, sortiert nach Relevanz
- Jeder Tag sollte kurz sein (1-3 Woerter)
- Bevorzuge existierende Tags gegenueber neuen
- Gib einen Confidence-Score zwischen 0.0 und 1.0 an
- Tags muessen zum Inhalt passen
- Verwende deutsche und englische Tags je nach Kontext

Antworte ausschliesslich mit einem JSON-Array in folgendem Format:
[
  { "tag": "Tag-Name", "confidence": 0.95, "category": "ai_tools" },
  { "tag": "Weiterer Tag", "confidence": 0.80 }
]

Wichtig: Gib NUR das JSON-Array zurueck, keinen weiteren Text.`;
}

// ---------------------------------------------------------------------------
// Tag Parsing
// ---------------------------------------------------------------------------

/**
 * Parse the AI response into structured tag suggestions.
 * Handles edge cases like markdown code blocks and malformed JSON.
 */
function parseTagSuggestions(
  content: string,
  maxSuggestions: number,
): TagSuggestion[] {
  // Strip markdown code block fences if present
  let cleaned = content.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  try {
    const parsed: unknown = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const suggestions: TagSuggestion[] = [];

    for (const item of parsed) {
      if (
        typeof item === "object" &&
        item !== null &&
        "tag" in item &&
        "confidence" in item
      ) {
        const record = item as Record<string, unknown>;
        const tag = String(record["tag"]).trim();
        const confidence = Number(record["confidence"]);
        const category =
          typeof record["category"] === "string"
            ? record["category"]
            : undefined;

        if (tag && !isNaN(confidence) && confidence >= 0 && confidence <= 1) {
          suggestions.push({
            tag,
            confidence: Math.round(confidence * 100) / 100,
            ...(category ? { category } : {}),
          });
        }
      }
    }

    // Sort by confidence descending and limit
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions);
  } catch {
    // JSON parsing failed - return empty
    return [];
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Suggest tags for the given content using the AI Router.
 *
 * @param content - Object with title and description
 * @returns Array of tag suggestions with confidence scores
 */
export async function suggestTags(
  content: AutoTagRequest,
): Promise<AutoTagResult> {
  const {
    title,
    description,
    existingTags,
    maxSuggestions = 5,
  } = content;

  const router = getAIRouter();
  const systemPrompt = buildAutoTagSystemPrompt(existingTags);

  const userMessage = `Analysiere den folgenden Inhalt und schlage passende Tags vor:

Titel: ${title}

Beschreibung:
${description}`;

  const messages: ChatMessage[] = [
    {
      id: `auto-tag-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    },
  ];

  const response = await router.chat({
    messages,
    systemPrompt,
    temperature: 0.3, // Lower temperature for more consistent tagging
    maxTokens: 1024,
    stream: false,
  });

  const suggestions = parseTagSuggestions(
    response.message.content,
    maxSuggestions,
  );

  return {
    suggestions,
    provider: response.provider,
    model: response.model,
  };
}
