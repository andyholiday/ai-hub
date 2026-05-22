# AI Orb Companion (Cosmos Companion)

**Was es ist:** Der "Cosmos Companion" ist ein dauerhaft sichtbarer, animierter KI-Begleiter (120px Fluid-Blob), der auf allen Dashboard-Seiten rechts unten eingeblendet wird und beim Klick ein eingebettetes Chat-Panel oeffnet.

## Mehrwert / Benefit

Der Orb gibt Nutzern jederzeit und auf jeder Seite schnellen Zugang zum KI-Assistenten, ohne in eine separate Seite navigieren zu muessen. Er kommuniziert den aktuellen Systemzustand (nachdenkend, Feier, Begruessing) visuell und kann proaktiv Hinweise geben — ohne aufdringlich zu sein.

## User-Prozess

1. Nutzer sieht den Orb rechts unten auf jeder Dashboard-Seite (nicht auf `/ai-mentor`).
2. Hovern zeigt einen Tooltip mit Kontext-Text (z.B. "AI Mentor oeffnen").
3. Klick oeffnet die `ChatSplitView` — ein 50/50-Overlay (Desktop) mit Glassmorphism-Header, Nachrichten-Liste, Kontext-Banner und Eingabefeld.
4. Nachrichten werden ueber `/api/ai/chat` gestreamt; die Session bleibt erhalten, solange die Browser-Session aktiv ist.
5. Minimize-Button schliessen den Chat und gibt den Fokus zurueck auf den Orb-Button.
6. Nutzer kann den Orb per Drag in eine der vier Bildschirmecken ziehen.

## Einfachheit & Fuehrung

- **Tooltip** beim Hovern erklaert den Zweck.
- **Kontext-Banner** im Chat-Panel zeigt die aktuelle Seite (via `OrbPageContext`).
- **Quick-Action-Chips** im Panel (Idee bewerten, Zusammenfassen, Vorschlag) senken die Einstiegshuerde.
- **Proaktive Bubbles** (wenn Feature-Flag `proactive-orb-bubble` aktiv): erscheinen nach Inaktivitaet, bei langem Verweilen auf einer Sektion oder bei Rueckkehr nach mehr als einem Tag. Per ESC oder X schliessbar.
- **aria-live-Region** kuendigt Statusaenderungen Screen-Readern an.
- **focus-visible-Ring** und Rueckgabe des Fokus nach Panel-Schliessen unterstuetzen reine Tastaturnavigation.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Haupt-Komponente | `src/components/features/ai-orb/cosmos-companion.tsx` |
| Zustandsverwaltung | `src/components/features/ai-orb/orb-provider.tsx` (React Context) |
| Animation (Blob) | `src/components/features/ai-orb/orb-animation-layer.tsx` |
| Idle-Maschine (XState) | `src/components/features/ai-orb/use-orb-idle-state.ts` |
| Chat-Panel | `src/components/features/ai-orb/chat-split-view.tsx` (lazy, SSR disabled) |
| Chat-Hook | `src/components/features/ai-orb/use-orb-chat.ts` |
| Seitenkontext | `src/components/features/ai-orb/orb-page-context.tsx` |
| Proaktive Bubbles | `src/components/features/ai-orb/use-orb-trigger.ts` + `bubble-speech.tsx` |
| Feier-Partikel | `src/components/features/ai-orb/celebration-fireworks.tsx` |
| Feature-Flags | `src/lib/features/feature-registry.ts` (`living-orb`, `proactive-orb-bubble`, `orb-idle-state`) |
| Chat-API | `src/app/api/ai/chat/route.ts` |
| DB-Tabellen | `ai_chat_sessions`, `ai_chat_messages` (RLS: nur eigene Daten) |

Der Orb wird im Dashboard-Layout via `<CosmosCompanion>` eingebunden (lazy, `ssr: false`). `useReducedMotion()` (Framer Motion) deaktiviert alle JS-Animationen wenn `prefers-reduced-motion` gesetzt ist.

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Orb sichtbar & animiert | Vollstaendig live |
| Chat oeffnen / schliessen | Vollstaendig live |
| Seitenkontext-Banner | Live (via `OrbPageContext`) |
| Chat-Session-Persistenz | Live (ADR-005, `use-orb-chat.ts`) |
| Session-Reload-Persistenz | Nicht live — `sessionId` liegt nur im React-State; Tab-Reload verliert die Bindung (Future Work, ADR-005) |
| Proaktive Bubbles | Hinter Feature-Flag `proactive-orb-bubble` (`defaultEnabled: false`) |
| Trigger INACTIVITY, SECTION_DWELL, RETURN_VISIT, DEEP_SCROLL, CODE_BLOCK_VISIBLE | Live (Datenquellen vorhanden) |
| Trigger XP_MILESTONE, FIRST_AI_CHAT, SEARCH_NO_RESULT | Gebaut, aber ohne Datenquelle — koennen nicht feuern |
| Drag-to-Dock | Live (4 Ecken) |
| Reduced-Motion | Live (JS via `useReducedMotion`, CSS via `@media prefers-reduced-motion`) |
| Dark Mode | Live fuer App-Shell und UI-Primitives; viele Feature-Seiten noch nicht konvertiert (Follow-up, kein Blocker) |

**Verwandte Entscheidungen:** [ADR-005](../architecture/adr/ADR-005-orb-chat-session-persistence.md) · [ADR-008](../architecture/adr/ADR-008-proactive-bubble-rule-engine.md) · [ADR-009](../architecture/adr/ADR-009-orb-idle-xstate.md)
