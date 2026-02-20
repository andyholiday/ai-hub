// =============================================================================
// AI Model Constants
// Display information and categorization for AI models
// =============================================================================

export interface AIModelDisplay {
  id: string;
  provider: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  capabilities: string[];
  bestFor: string;
}

export const AI_MODEL_DISPLAYS: AIModelDisplay[] = [
  {
    id: "gemini",
    provider: "Google",
    name: "Gemini",
    description: "Googles multimodales KI-Modell mit starker Reasoning-Faehigkeit",
    icon: "/images/icons/gemini.svg",
    color: "#4285F4",
    capabilities: ["Text", "Bilder", "Code", "Analyse"],
    bestFor: "Allgemeine Fragen und multimodale Aufgaben",
  },
  {
    id: "claude",
    provider: "Anthropic",
    name: "Claude",
    description: "Sicheres und hilfreiches KI-Modell mit starkem Textverstaendnis",
    icon: "/images/icons/claude.svg",
    color: "#D97706",
    capabilities: ["Text", "Analyse", "Code", "Zusammenfassungen"],
    bestFor: "Lange Texte, Analysen und nuancierte Antworten",
  },
  {
    id: "openai",
    provider: "OpenAI",
    name: "ChatGPT",
    description: "Vielseitiges KI-Modell mit breitem Wissensspektrum",
    icon: "/images/icons/openai.svg",
    color: "#10A37F",
    capabilities: ["Text", "Code", "Kreativitaet", "Bilder"],
    bestFor: "Kreative Aufgaben und vielseitige Problemloesung",
  },
  {
    id: "copilot",
    provider: "Microsoft",
    name: "Copilot",
    description: "Microsoft Copilot mit Office-Integration",
    icon: "/images/icons/copilot.svg",
    color: "#6366F1",
    capabilities: ["Text", "Office", "Web-Suche"],
    bestFor: "Office-Aufgaben und Web-Recherche",
  },
];
