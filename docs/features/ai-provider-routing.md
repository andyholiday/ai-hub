# AI Provider Routing

**Was es ist:** Ein serverseitiger Multi-Provider-Router (`src/lib/ai/router.ts`), der Chat-Anfragen an den geeignetsten verfuegbaren KI-Provider weiterleitet, eine konfigurierbare Fallback-Chain durchlaeuft, API-Kosten loggt und Privacy-Mode-Anfragen zwingend auf Mistral EU umleitet.

## Mehrwert / Benefit

Kein Vendor-Lock-in: Wenn Gemini ausfallt, wechselt der Router automatisch auf OpenAI, dann Claude, dann Copilot. Admins konfigurieren die Kette ueber das Admin-Panel ohne Code-Aenderung. Privacy-Mode garantiert EU-Datenhaltung. Ein optionaler LLM-Gate reduziert unnoetige API-Kosten.

## User-Prozess (Nutzer-Perspektive)

- Der Nutzer sendet eine Nachricht im AI Mentor oder Orb-Chat.
- Der Router waehlt transparent den besten verfuegbaren Provider.
- Bei Provider-Ausfall: keine Fehlermeldung, der Router wechselt automatisch.
- Bei aktivem Privacy-Mode: Antworten kommen ausschliesslich von Mistral EU (Frankreich).

## Wie es funktioniert (technisch, knapp)

### Fallback-Chain (Standard)

```text
[1] Gemini (Google) → [2] OpenAI → [3] Claude (Anthropic) → [4] Copilot (Azure)
```

Jeder Provider implementiert das `IAIProvider`-Interface mit `chat()`, `chatStream()` und `isAvailable()`. Bei Fehler oder Nichtverfuegbarkeit wandert der Router zum naechsten in der Kette. Alle Provider sind in `src/lib/ai/providers/` implementiert.

### Privacy-Routing (ADR-013)

Wenn `request.privacyMode === true`, wird die Fallback-Chain uebersprungen und zwingend `MistralEuProvider` verwendet. Kein anderer Provider erhaelt Privacy-Mode-Anfragen.

### LLM-Gate (Pattern P1.2, Feature-Flag `llm-gate`)

Ein heuristisches Gate prueft vor dem eigentlichen LLM-Call, ob die Anfrage komplex genug ist, um einen teuren API-Call zu rechtfertigen. Einfache Anfragen werden kurzgeschlossen. Aktuell `defaultEnabled: false`.

### Budget-Cap (Migration 00025)

Race-freie atomare Budget-Reservierung via `check_and_reserve_ai_budget()` PostgreSQL-RPC. Bei Ueberschreitung: HTTP 429. Bei >= 80% des Limits: `softCap=true` (degradiert auf groq/llama). Wiring ist live (`route.ts:300`). Ausstehend: Abgleich tatsaechlicher vs. geschaetzter Kosten nach Abschluss des Requests.

### Kosten-Logging

Jeder AI-Call schreibt einen fire-and-forget Eintrag in `ai_cost_log` (provider, tokens input/output, geschaetzte Kosten, Feature-Kontext).

| Schicht | Datei |
|---------|-------|
| Router | `src/lib/ai/router.ts` |
| Provider-Implementierungen | `src/lib/ai/providers/gemini.ts`, `openai.ts`, `claude.ts`, `copilot.ts`, `mistral-eu.ts`, `groq.ts`, `mistral.ts` |
| Basis-Provider | `src/lib/ai/providers/base.ts` |
| Konfiguration | `src/lib/ai/config.ts` |
| Types | `src/lib/ai/types.ts` |
| Budget-RPC | `supabase/migrations/00025_ai_budget_cap.sql` |
| C2PA-Audit-Log | `supabase/migrations/00024_audit_logs.sql` |
| Admin-Konfiguration | `src/app/(admin)/admin/ai-config/page.tsx` |
| DB-Tabellen | `ai_providers`, `ai_cost_log`, `ai_budget_reservations`, `audit_logs` |

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Fallback-Chain (4 Provider) | Live |
| Privacy-Mode → Mistral EU | Live (ADR-013) |
| Streaming + non-Streaming | Live |
| Kosten-Logging | Live (fire-and-forget) |
| Budget-Cap-Schema | Live (Migration 00025) |
| Budget-Cap-Enforcement in der Chat-Route | Live — `enforceBudget()` bei `route.ts:300`; 429 bei Ueberschreitung, Soft-Cap (>=80%) degradiert auf groq; Fail-OPEN bei RPC-Ausfall ist bewusster Availability-Tradeoff; ausstehend: Abgleich tatsaechlicher vs. geschaetzter Kosten nach Abschluss |
| LLM-Gate | Gebaut, Feature-Flag `defaultEnabled: false` |
| Provider-Keys aus DB/Vault | Live via `getAIRouterWithDBKeys()` fuer den normalen Chat-Pfad |
| Provider-Test (Admin-Sandbox) | Nutzt ENV-Keys statt DB-Keys (P1-Bug aus Audit) |
| Streaming-Cancel bei Client-Disconnect | Live — AbortSignal durch Router und alle Provider; `ReadableStream.cancel()` bricht den Upstream ab (`route.ts` ~589) |
| `maxTokens`/`temperature` Client-Validierung | Live — Zod-Schema: max 50 Nachrichten, 100KB, maxTokens <= 4096, temperature 0–1, Provider-Enum; `role:"system"` wird serverseitig abgelehnt |

**Verwandte Entscheidungen:** [ADR-013](../architecture/adr/ADR-013-mistral-eu-privacy-llm.md) · [../features/pricing-layer.md](./pricing-layer.md)
