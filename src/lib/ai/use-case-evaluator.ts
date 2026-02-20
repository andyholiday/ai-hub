// =============================================================================
// Use-Case Evaluator Service
// Evaluates AI use-case ideas using the existing AI Router.
// Returns structured scores, recommendations, and actionable insights.
// =============================================================================

import { getAIRouter } from "./router";
import type { ChatMessage } from "./types";
import type {
  UseCaseScores,
  UseCaseEvaluation,
  Recommendation,
} from "@/lib/validators/evaluation";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Scoring weights for the overall score calculation. */
const SCORE_WEIGHTS: Record<keyof UseCaseScores, number> = {
  impact: 0.3,
  feasibility: 0.25,
  aiReadiness: 0.2,
  innovation: 0.15,
  effort: 0.1,
};

/** Recommendation thresholds (applied to the weighted overall score). */
const RECOMMENDATION_THRESHOLDS: Array<{
  minScore: number;
  recommendation: Recommendation;
}> = [
  { minScore: 75, recommendation: "highly_recommended" },
  { minScore: 55, recommendation: "recommended" },
  { minScore: 35, recommendation: "consider" },
  { minScore: 0, recommendation: "not_recommended" },
];

// ---------------------------------------------------------------------------
// System Prompt
// ---------------------------------------------------------------------------

function buildEvaluationSystemPrompt(): string {
  return `Du bist ein erfahrener KI-Strategie-Berater bei einem Unternehmen. Deine Aufgabe ist es, vorgeschlagene KI-Use-Cases zu bewerten und strukturiertes Feedback zu geben.

Bewerte den Use-Case anhand folgender Kriterien (jeweils 0-100 Punkte):

1. **feasibility** (Technische Machbarkeit): Wie realistisch ist die Umsetzung mit aktueller KI-Technologie? Beruecksichtige Datenverfuegbarkeit, technische Komplexitaet und existierende Loesungen.

2. **impact** (Business Impact): Welchen geschaeftlichen Mehrwert bringt dieser Use-Case? Beruecksichtige Kostenersparnis, Umsatzsteigerung, Effizienzgewinn und strategische Relevanz.

3. **effort** (Implementierungsaufwand): Wie aufwendig ist die Umsetzung? 100 = sehr wenig Aufwand (schnell umzusetzen), 0 = extrem hoher Aufwand. Beruecksichtige Entwicklungszeit, benoetigte Ressourcen und Integrationsaufwand.

4. **innovation** (Innovationsgrad): Wie innovativ ist der Ansatz? Ist es ein gaengiger Use-Case oder ein neuartiger Ansatz?

5. **aiReadiness** (KI-Eignung): Wie gut eignet sich KI fuer dieses Problem? Gibt es genuegend Trainingsdaten? Ist das Problem gut durch KI loesbar?

Erstelle ausserdem:
- **evaluationText**: Eine ausfuehrliche deutsche Bewertung in 2-3 Absaetzen
- **strengths**: 3-5 spezifische Staerken des Use-Cases
- **risks**: 2-4 identifizierte Risiken oder Herausforderungen
- **nextSteps**: 3-5 konkrete empfohlene naechste Schritte

Antworte ausschliesslich mit einem JSON-Objekt in folgendem Format:
{
  "scores": {
    "feasibility": <0-100>,
    "impact": <0-100>,
    "effort": <0-100>,
    "innovation": <0-100>,
    "aiReadiness": <0-100>
  },
  "evaluationText": "<Deutsche Bewertung, 2-3 Absaetze>",
  "strengths": ["Staerke 1", "Staerke 2", "Staerke 3"],
  "risks": ["Risiko 1", "Risiko 2"],
  "nextSteps": ["Schritt 1", "Schritt 2", "Schritt 3"]
}

Wichtig:
- Gib NUR das JSON-Objekt zurueck, keinen weiteren Text
- Alle Texte auf Deutsch
- Sei konstruktiv aber realistisch in deiner Bewertung
- Beruecksichtige den Kontext eines mittelstaendischen Unternehmens`;
}

// ---------------------------------------------------------------------------
// AI Response Parsing
// ---------------------------------------------------------------------------

interface RawEvaluationResponse {
  scores: {
    feasibility: number;
    impact: number;
    effort: number;
    innovation: number;
    aiReadiness: number;
  };
  evaluationText: string;
  strengths: string[];
  risks: string[];
  nextSteps: string[];
}

/**
 * Extract and parse a JSON object from the AI response text.
 * Handles edge cases like markdown code blocks and surrounding text.
 */
function parseEvaluationResponse(content: string): RawEvaluationResponse | null {
  let cleaned = content.trim();

  // Strip markdown code block fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  // Try to extract JSON object if surrounded by other text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    const parsed: unknown = JSON.parse(cleaned);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const obj = parsed as Record<string, unknown>;

    // Validate required structure
    if (
      typeof obj["scores"] !== "object" ||
      obj["scores"] === null ||
      typeof obj["evaluationText"] !== "string" ||
      !Array.isArray(obj["strengths"]) ||
      !Array.isArray(obj["risks"]) ||
      !Array.isArray(obj["nextSteps"])
    ) {
      return null;
    }

    const scores = obj["scores"] as Record<string, unknown>;

    // Validate all score fields are numbers in range
    const scoreKeys = ["feasibility", "impact", "effort", "innovation", "aiReadiness"] as const;
    for (const key of scoreKeys) {
      const val = scores[key];
      if (typeof val !== "number" || val < 0 || val > 100) {
        return null;
      }
    }

    return {
      scores: {
        feasibility: Math.round(scores["feasibility"] as number),
        impact: Math.round(scores["impact"] as number),
        effort: Math.round(scores["effort"] as number),
        innovation: Math.round(scores["innovation"] as number),
        aiReadiness: Math.round(scores["aiReadiness"] as number),
      },
      evaluationText: String(obj["evaluationText"]),
      strengths: (obj["strengths"] as unknown[]).map(String),
      risks: (obj["risks"] as unknown[]).map(String),
      nextSteps: (obj["nextSteps"] as unknown[]).map(String),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Score Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the weighted overall score from individual dimension scores.
 */
function calculateOverallScore(scores: UseCaseScores): number {
  let total = 0;
  for (const [key, weight] of Object.entries(SCORE_WEIGHTS)) {
    total += scores[key as keyof UseCaseScores] * weight;
  }
  return Math.round(total);
}

/**
 * Determine the recommendation tier based on the overall score.
 */
function determineRecommendation(overallScore: number): Recommendation {
  for (const threshold of RECOMMENDATION_THRESHOLDS) {
    if (overallScore >= threshold.minScore) {
      return threshold.recommendation;
    }
  }
  return "not_recommended";
}

// ---------------------------------------------------------------------------
// Fallback Evaluation
// ---------------------------------------------------------------------------

/**
 * Provide a fallback evaluation when the AI is unavailable.
 * Returns neutral mid-range scores with a note that AI evaluation failed.
 */
function createFallbackEvaluation(): UseCaseEvaluation {
  const scores: UseCaseScores = {
    feasibility: 50,
    impact: 50,
    effort: 50,
    innovation: 50,
    aiReadiness: 50,
  };

  const overallScore = calculateOverallScore(scores);

  return {
    scores,
    overallScore,
    recommendation: determineRecommendation(overallScore),
    evaluationText:
      "Die automatische KI-Bewertung konnte nicht durchgefuehrt werden. " +
      "Die angezeigten Werte sind Platzhalterwerte. " +
      "Bitte versuche es spaeter erneut oder wende dich an einen Administrator.",
    strengths: [
      "Bewertung konnte nicht durchgefuehrt werden",
    ],
    risks: [
      "Keine automatische Bewertung verfuegbar",
    ],
    nextSteps: [
      "Bewertung erneut anfordern",
      "Administrator kontaktieren falls das Problem weiterhin besteht",
    ],
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface EvaluateUseCaseRequest {
  title: string;
  description: string;
}

export interface EvaluateUseCaseResult {
  evaluation: UseCaseEvaluation;
  provider: string;
  model: string;
  isFallback: boolean;
}

/**
 * Evaluate a use-case idea using the AI Router.
 *
 * @param request - The use-case title and description to evaluate.
 * @returns Structured evaluation with scores, recommendation, and details.
 */
export async function evaluateUseCase(
  request: EvaluateUseCaseRequest,
): Promise<EvaluateUseCaseResult> {
  const router = getAIRouter();
  const systemPrompt = buildEvaluationSystemPrompt();

  const userMessage = `Bewerte den folgenden KI-Use-Case:

**Titel:** ${request.title}

**Beschreibung:**
${request.description}`;

  const messages: ChatMessage[] = [
    {
      id: `eval-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    },
  ];

  try {
    const response = await router.chat({
      messages,
      systemPrompt,
      temperature: 0.4,
      maxTokens: 2048,
      stream: false,
    });

    const parsed = parseEvaluationResponse(response.message.content);

    if (!parsed) {
      // AI responded but with unparseable content - return fallback
      return {
        evaluation: createFallbackEvaluation(),
        provider: response.provider,
        model: response.model,
        isFallback: true,
      };
    }

    const overallScore = calculateOverallScore(parsed.scores);
    const recommendation = determineRecommendation(overallScore);

    const evaluation: UseCaseEvaluation = {
      scores: parsed.scores,
      overallScore,
      recommendation,
      evaluationText: parsed.evaluationText,
      strengths: parsed.strengths,
      risks: parsed.risks,
      nextSteps: parsed.nextSteps,
    };

    return {
      evaluation,
      provider: response.provider,
      model: response.model,
      isFallback: false,
    };
  } catch {
    // All AI providers failed - return fallback
    return {
      evaluation: createFallbackEvaluation(),
      provider: "none",
      model: "none",
      isFallback: true,
    };
  }
}
