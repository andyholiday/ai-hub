"use client";

// =============================================================================
// Provider Sandbox Component
// Test and compare AI provider responses side-by-side
// =============================================================================

import { useState } from "react";
import { FlaskConical, Play, Clock, BarChart3, Coins } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button, Input } from "@/components/ui";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface SandboxResult {
  id: string;
  providerName: string;
  providerIcon: string;
  response: string;
  latency: string;
  tokens: string;
  cost: string;
  available: boolean;
}

export interface ProviderSandboxProps {
  /** Preloaded results */
  results?: SandboxResult[];
  /** Callback when "Test all" is clicked */
  onTest?: (prompt: string) => void;
  /** Whether a test is running */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Additional CSS classes */
  className?: string;
}

// -----------------------------------------------------------------------------
// Default Demo Data
// -----------------------------------------------------------------------------

const DEFAULT_PROMPT =
  "Erklaere in 2 Saetzen, was Prompt Engineering ist.";

const DEFAULT_RESULTS: SandboxResult[] = [
  {
    id: "gemini",
    providerName: "Gemini 2.5 Pro",
    providerIcon: "\u2728",
    response:
      "Prompt Engineering ist die Kunst, KI-Modellen durch gezielt formulierte Anweisungen optimale Ergebnisse zu entlocken. Durch Techniken wie Chain-of-Thought oder Few-Shot-Learning wird die Qualitaet der KI-Antworten systematisch verbessert.",
    latency: "1.2s",
    tokens: "87 Tokens",
    cost: "\u20AC0.0012",
    available: true,
  },
  {
    id: "claude",
    providerName: "Claude Sonnet 4.5",
    providerIcon: "\uD83D\uDFE0",
    response:
      "Prompt Engineering beschreibt das systematische Formulieren von Eingabeaufforderungen an KI-Systeme, um moeglichst praezise und nuetzliche Antworten zu erhalten. Dabei kommen verschiedene Techniken zum Einsatz, von klaren Rollenanweisungen bis hin zu strukturierten Denkschritten.",
    latency: "1.8s",
    tokens: "92 Tokens",
    cost: "\u20AC0.0018",
    available: true,
  },
  {
    id: "chatgpt",
    providerName: "GPT-4o",
    providerIcon: "\uD83D\uDCAC",
    response:
      "Prompt Engineering ist die Disziplin, Eingabetexte fuer KI-Modelle so zu gestalten, dass sie relevante und qualitativ hochwertige Antworten liefern. Es umfasst Techniken wie das Setzen von Kontext, das Definieren von Formaten und das schrittweise Heranfuehren an komplexe Aufgaben.",
    latency: "1.5s",
    tokens: "95 Tokens",
    cost: "\u20AC0.0015",
    available: true,
  },
  {
    id: "copilot",
    providerName: "Copilot (Azure)",
    providerIcon: "\uD83D\uDD37",
    response:
      "Provider nicht konfiguriert. Bitte API-Key und Endpoint hinterlegen.",
    latency: "",
    tokens: "",
    cost: "",
    available: false,
  },
];

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ProviderSandbox({
  results: initialResults,
  onTest,
  isLoading = false,
  error,
  className,
}: ProviderSandboxProps) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const results = initialResults ?? DEFAULT_RESULTS;

  const handleTest = () => {
    onTest?.(prompt);
  };

  return (
    <div
      className={cn(
        "rounded-[14px] border border-surface-200 bg-white p-6 shadow-card",
        className
      )}
    >
      {/* Section Title */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-4 w-[3px] rounded-sm bg-lr-green-500" />
        <FlaskConical className="h-4 w-4 text-surface-500" />
        <h3 className="font-display text-base font-semibold text-surface-900">
          Provider-Vergleich (Sandbox)
        </h3>
      </div>

      {/* Description */}
      <p className="mb-3 text-[13px] leading-relaxed text-surface-500">
        Sende dieselbe Anfrage an alle aktiven Provider und vergleiche die
        Ergebnisse.
      </p>

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
          {error}
        </div>
      )}

      {/* Input + Button */}
      <div className="flex gap-2.5">
        <div className="flex-1">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Gib einen Test-Prompt ein..."
            size="md"
          />
        </div>
        <Button
          size="md"
          variant="primary"
          iconLeft={<Play />}
          className="shrink-0"
          onClick={handleTest}
          isLoading={isLoading}
          loadingText="Teste..."
        >
          Alle testen
        </Button>
      </div>

      {/* Results Grid */}
      {results.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {results.map((result) => (
            <div
              key={result.id}
              className={cn(
                "rounded-[10px] border border-surface-100 bg-[#F7F8FA] p-4",
                !result.available && "opacity-50"
              )}
            >
              {/* Provider Name */}
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-surface-900">
                <span className="text-base" aria-hidden="true">
                  {result.providerIcon}
                </span>
                {result.providerName}
              </div>

              {/* Response */}
              <div
                className={cn(
                  "max-h-[120px] overflow-y-auto text-xs leading-relaxed text-surface-500",
                  !result.available && "italic text-surface-400"
                )}
              >
                {result.response}
              </div>

              {/* Meta */}
              <div className="mt-2 flex items-center gap-3 text-[10px] text-surface-400">
                {result.available ? (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {result.latency}
                    </span>
                    {result.tokens && (
                      <span className="inline-flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {result.tokens}
                      </span>
                    )}
                    {result.cost && (
                      <span className="inline-flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {result.cost}
                      </span>
                    )}
                  </>
                ) : (
                  <span>Nicht verfuegbar</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
