# Pricing Layer

**Status:** In Bearbeitung (Phase 2.1)
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

- `src/lib/ai/pricing.ts` — TODO: neues Modul (nach Developer-Merge verifizieren)
- `src/app/api/ai/chat/route.ts` — TODO: `COST_PER_1K` entfernt, `calculateCost()` eingebunden
- `src/lib/ai/config.ts` — Single Source of Truth fuer Pricing-Werte (unveraendert)
- `tests/unit/lib/ai/pricing.test.ts` — TODO: nach Developer-Merge verifizieren

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

- TODO: Implementierungs-Status nach Developer-Merge eintragen
- TODO: Test-Coverage-Ergebnis ergaenzen (Wave 3 — Quality)
- TODO: Gemini Free-Tier-Policy-Entscheidung dokumentieren (offener Punkt aus
  pricing-design.md)

## History

- 2026-05-01 — ADR/Design in `docs/architecture/pricing-design.md` committed
  (Architect Wave 1). Developer-Implementation laeuft parallel (Phase 2 Wave 2).
