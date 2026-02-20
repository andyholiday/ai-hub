// =============================================================================
// Prompt Templates
// Reusable prompt templates for AI-powered features
// =============================================================================

/**
 * Template for generating quiz questions from lesson content
 */
export function quizGenerationPrompt(lessonContent: string, questionCount: number): string {
  return `Basierend auf dem folgenden Lerninhalt, erstelle ${questionCount} Multiple-Choice-Fragen.

Lerninhalt:
${lessonContent}

Format fuer jede Frage:
{
  "question": "Die Frage",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Erklaerung der richtigen Antwort"
}

Antworte ausschliesslich mit einem JSON-Array der Fragen.`;
}

/**
 * Template for summarizing community threads
 */
export function threadSummaryPrompt(posts: string[]): string {
  return `Fasse die folgende Community-Diskussion in 3-5 Saetzen zusammen. Hebe die wichtigsten Erkenntnisse und Tipps hervor.

Beitraege:
${posts.map((p, i) => `[Beitrag ${i + 1}]: ${p}`).join("\n\n")}

Zusammenfassung:`;
}

/**
 * Template for content improvement suggestions
 */
export function contentSuggestionPrompt(title: string, content: string): string {
  return `Analysiere den folgenden Best-Practice-Beitrag und gib 3 konkrete Verbesserungsvorschlaege:

Titel: ${title}
Inhalt: ${content}

Gib Vorschlaege in folgendem Format:
1. [Kategorie]: Vorschlag
2. [Kategorie]: Vorschlag
3. [Kategorie]: Vorschlag

Kategorien: Struktur, Klarheit, Beispiele, Vollstaendigkeit, Praxisbezug`;
}
