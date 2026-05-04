# Pricing Layer

**Status:** Implemented (2026-05-04)
**Phase:** 2 — Funktionale Bugs
**Owner:** Developer-Backend

## Zweck

Zentraler Lookup-Layer fuer Token-Kosten aller AI-Provider. Ersetzt die
hartkodierte `COST_PER_1K`-Konstante in `src/app/api/ai/chat/route.ts` und
schliesst die Luecke fuer Groq und Mistral (bisher $0-Abrechnung fuer 2 von
6 Providern).

## Architektur-Link

- [pricing-design.md](../architecture/pricing-design.md) — vollstaendige
  Architektur-Entscheidung, API-Surface, Mermaid-Diagramm, Test-Plan

## Code-Refs

- `src/lib/ai/pricing.ts` — Pricing-Modul (merged in main, Commit `01ec856`)
- `src/app/api/ai/chat/route.ts` — `COST_PER_1K` entfernt, `calculateCost()` eingebunden
- `src/lib/ai/config.ts` — Single Source of Truth fuer Pricing-Werte (unveraendert)
- `tests/unit/lib/ai/pricing.test.ts` — 20 Unit-Tests (gruen)
- `tests/integration/api/ai/chat.test.ts` — 8 Integrationstests fuer `logTokenUsage`-Pfad (gruen)

## Oeffentliche API

```typescript
// src/lib/ai/pricing.ts
export function getPricingRates(
  provider: AIProvider | string,
  modelName: string
): { inputPer1k: number; outputPer1k: number }

export function calculateCost(
  provider: AIProvider | string,
  modelName: string,
  usage: { promptTokens: number; completionTokens: number }
): TokenCost
```

Vollstaendige Signaturen und Verhalten: [pricing-design.md](../architecture/pricing-design.md).

## Open Issues

- **Streaming-Token-Tracking** — Im Streaming-Pfad liefern Provider `promptTokens: 0,
  completionTokens: 0`. `calculateCost()` gibt korrekt `$0` zurueck, aber die
  tatsaechlichen Kosten werden nicht erfasst. Fix als `#issue-TBD` geplant.
- **Gemini Free-Tier-Policy** — `gemini-2.0-flash` hat `inputCostPer1k: 0` in
  `config.ts` (Free-Tier-Annahme). JSDoc-Kommentar mit Verweis auf
  `pricing-design.md` im Code ergaenzt (Fix B05, Commit `0b77706`). Policy bleibt
  unveraendert bis Phase 6.
- **Mixtral Deprecation bei Groq** — `mixtral-8x7b-32768` ist Deprecation-Kandidat.
  Modell-Registry-Update fuer Phase 4 geplant.

## Quality-Review

Siehe [docs/quality/PHASE-2-BACKEND-REVIEW.md](../quality/PHASE-2-BACKEND-REVIEW.md)
(2 Iterationen, final GO nach Commit `0a39d65`).

- Test-Coverage: 28 Tests gesamt (20 Unit in `pricing.test.ts` + 8 Integration
  in `chat.test.ts`), alle gruen
- Keine neue DB-Migration in Phase 2.1 (Schema unveraendert)
- `expires_at`-Kompatibilitaet: nicht relevant fuer Pricing-Layer

## History

- 2026-05-04 — Branches `feature/phase-2-backend` gemerged in `main` (Commit
  `01ec856`). 219/219 Tests gruen. Status: Implemented.
- 2026-05-01 — ADR/Design in `docs/architecture/pricing-design.md` committed
  (Architect Wave 1). Developer-Implementation laeuft parallel (Phase 2 Wave 2).
