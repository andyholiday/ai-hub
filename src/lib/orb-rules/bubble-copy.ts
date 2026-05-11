// ADR: docs/architecture/adr/ADR-008-proactive-bubble-rule-engine.md
// Pattern P3.2 — Proaktive Orb-Bubble (regelbasiert, kein LLM-Call)

// =============================================================================
// Orb Bubble — MicroCopy (Pattern P3.2)
// Deutsche Bubble-Texte fuer alle 8 Trigger-Events.
// Template-Variablen: {{query}}, {{xp}}, {{nextStep}}, {{lastSection}}
// =============================================================================

import type { TriggerEvent, BubblePayload } from './trigger-types';

export function getBubbleCopy(event: TriggerEvent): Omit<BubblePayload, 'triggerKind'> {
  switch (event.kind) {
    case 'SECTION_DWELL':
      return {
        headline: 'Da steckt mehr drin.',
        body: 'Dieser Abschnitt hat ein paar Querverbindungen, die nicht sofort sichtbar sind. Frag mich einfach, wenn du tiefer willst.',
      };
    case 'CODE_BLOCK_VISIBLE':
      return {
        headline: 'Code gefunden.',
        body: 'Ich kann den erklaren, Varianten zeigen oder direkt ins Projekt einbauen — sag einfach Bescheid.',
      };
    case 'SEARCH_NO_RESULT':
      return {
        headline: 'Nichts gefunden — aber vielleicht ich.',
        body: `Zu '${event.query}' habe ich hier keine Treffer, aber ich kenne das Thema. Stell mir die Frage direkt.`,
      };
    case 'INACTIVITY':
      return {
        headline: 'Kurze Pause?',
        body: 'Ich bin noch hier, wenn du weitermachst. Keine Eile.',
      };
    case 'XP_MILESTONE':
      return {
        headline: 'Level-Up.',
        body: `Du hast gerade ${event.xp} XP uberschritten. Gut gemacht — der nachste Schritt ware ${event.nextStep}.`,
      };
    case 'FIRST_AI_CHAT':
      return {
        headline: 'Erster Kontakt.',
        body: 'Du kannst mich alles fragen, was mit dem Projekt zu tun hat. Ich antworte prazise, nicht ausschweifend.',
      };
    case 'DEEP_SCROLL':
      return {
        headline: 'Du hast das Meiste gelesen.',
        body: 'Falls du eine Zusammenfassung oder den nachsten Schritt willst — ich mach das in 30 Sekunden.',
      };
    case 'RETURN_VISIT':
      return {
        headline: 'Wieder da.',
        body: `Zuletzt warst du bei '${event.lastSection}'. Soll ich dich dort wieder abholen?`,
      };
  }
}
