# AI Mentor

**Was es ist:** Eine dedizierte Chat-Seite (`/ai-mentor`), auf der Nutzer mit einem Multi-Provider-KI-Assistenten (Standard: Gemini) in Echtzeit-Streaming interagieren koennen. Der AI Mentor ist die vollstaendige, unbegrenzte Chat-Erfahrung — im Gegensatz zum Orb, der einen schnellen Zugang von jeder Seite bietet.

## Mehrwert / Benefit

Der AI Mentor ist der zentrale Lernbegleiter der Plattform: Er beantwortet Fragen zu KI-Themen, hilft beim Formulieren von Prompts, bewertet Use-Cases und empfiehlt den naechsten Kurs. Da der Orb auf der AI-Mentor-Seite ausgeblendet wird, steht der volle Viewport fuer den Chat zur Verfuegung.

## User-Prozess

1. Nutzer navigiert zu `/ai-mentor` (Sidebar oder Command-Palette).
2. Die Seite zeigt vier Quick-Action-Chips (KI-Grundlagen, Prompt verbessern, Use-Case bewerten, Lernempfehlung).
3. Klick auf einen Chip oder eigene Eingabe im Textfeld sendet eine Nachricht.
4. Das LLM antwortet mit Streaming (Token fuer Token); der Orb wechselt auf den "thinking"-State.
5. Chat-Verlauf bleibt waehrend der Session erhalten.
6. Nutzer kann unter `/ai-mentor/[sessionId]` eine bestimmte Session aufrufen (Deep-Link).

## Einfachheit & Fuehrung

- **Quick-Action-Chips** senken die Eingabehuerde: kein leerer Startpunkt.
- **Mentor-Stats-Karten** (oberhalb des Chats) zeigen gesendete Nachrichten, bearbeitete Themen und Level — geben dem Nutzer ein Gefuehl von Fortschritt.
- **Content Moderation** ist aktiv — unangemessene Inhalte werden abgelehnt, ohne den Nutzer zu verunsichern.
- Der **Orb** ist auf dieser Seite ausgeblendet (`pathname === '/ai-mentor'`), um Konflikte mit der Chat-UI zu vermeiden.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Seite | `src/app/(dashboard)/ai-mentor/page.tsx` |
| Session-Detail | `src/app/(dashboard)/ai-mentor/[sessionId]/page.tsx` |
| Chat-API | `src/app/api/ai/chat/route.ts` (POST, Streaming via AI SDK) |
| AI Router | `src/lib/ai/router.ts` — Fallback-Chain Gemini → OpenAI → Claude → Copilot |
| Zustand | `stores/chat.ts` (Zustand) + `OrbProvider` Context |
| Feature-Flag | `ai-mentor` (defaultEnabled: true, userToggleable) |
| Cost-Logging | `ai_cost_log`-Tabelle (fire-and-forget nach jedem Call) |
| Rate-Limiting | Tier "ai" — 20 Requests / 60 Sekunden (Upstash Redis) |

**Sicherheits-Items aus dem Audit (behoben):**
- Client-seitige `role:"system"`-Nachrichten werden serverseitig abgelehnt — Zod-Enum erlaubt nur "user"|"assistant".
- Streaming-`cancel()` bei Client-Disconnect ist live — AbortSignal durch Route und alle Provider; `ReadableStream.cancel()` bricht den Upstream ab.
- `maxTokens`/`temperature` werden serverseitig validiert: maxTokens <= 4096, temperature 0–1, max 50 Nachrichten, 100KB Limit.

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Chat mit Streaming | Live |
| Fallback-Chain (4 Provider) | Live |
| Session-Persistenz (DB) | Live via `use-orb-chat.ts` und `ai_chat_sessions`/`ai_chat_messages` |
| Session-Reload-Persistenz | Nicht live — `sessionId` nur im React-State |
| Pagination der Chat-History | Nicht live — `loadMore()` ist ein No-Op (Phase-3-Scope) |
| Content Moderation | Live (serverseitig) |
| Budget-Cap Enforcement | Live — `enforceBudget()` in `route.ts:300`; 429 bei Ueberschreitung, Soft-Cap degradiert auf groq; Ausstehend: actual-vs-estimate Reconciliation |
