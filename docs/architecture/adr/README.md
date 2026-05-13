# Architecture Decision Records — AI Hub

| ADR | Titel | Status | Datum |
|-----|-------|--------|-------|
| ADR-001 | AI SDK v4 als einheitliche Provider-Abstraktionsschicht | Proposed | — |
| ADR-002 | Monorepo-Strategie (pnpm workspaces) | Proposed | — |
| ADR-003 | API-Key-Verschlüsselung für ai_providers | Accepted | 2026-04-30 |
| ADR-004 | Polymorphe Entities durch FK-Tabellen-Design ersetzen | Proposed | — |
| ADR-005 | Orb-Chat-Session-Persistenz via Supabase | Accepted | 2026-05-01 |
| ADR-006 | (frei für künftige Phase-5/6-ADRs) | — | — |
| ADR-007 | Living Orb v2 — Wandernder Orb (Layer 3.1) | Accepted | 2026-05-06 |
| ADR-008 | Proaktive Orb-Kommentare — Regelbasierte Engine (Layer 3.2) | Accepted | 2026-05-06 |
| ADR-009 | Living Orb v2 — Idle-State-Machine mit XState v5 (Layer 3.3) | Accepted | 2026-05-06 |
| ADR-010 | Privacy Mode — Lokale Embeddings (@xenova/transformers) | Accepted | 2026-05-06 |
| ADR-011 | Privacy Mode — EU-Bedrock LLM-Provider | Superseded by ADR-013 | 2026-05-06 |
| ADR-012 | Privacy Mode — C2PA v2.4 Audit-Log (Art. 50 KI-Transparenz) | Accepted | 2026-05-06 |
| ADR-013 | Privacy Mode — Mistral EU-Privacy-Provider (supersedes ADR-011) | Accepted | 2026-05-07 |
| ADR-014 | Postgres-Native Hybrid Search (tsvector + pgvector + RRF) | Accepted | 2026-05-07 |

> ADR-001, 002, 004 sind Skizzen aus dem Architect-Review (siehe
> `docs/IMPROVEMENTS.md` Anhang). Werden als formale ADRs ausgearbeitet
> sobald die jeweilige Phase aktiv wird. ADR-006 bleibt frei.
