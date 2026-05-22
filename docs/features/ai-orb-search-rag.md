# AI Orb Search RAG

**Was es ist:** Der Cosmos Companion gruendet Antworten in einem serverseiten Hybrid-Search-Index ueber Best-Practice-Inhalte. Wenn ein Nutzer den Orb nach Inhalten der App fragt, durchsucht das System die Datenbank (BM25 + Vektorsuche, RLS-sicher) und reichert die Antwort mit gefundenen Quellen an.

## Mehrwert / Benefit

Anstatt nur auf das Trainingswissen des LLM zu vertrauen, liefert der Orb Antworten, die auf den tatssaechlich in der Plattform gespeicherten Best Practices basieren. Das verhindert Halluzinationen bei plattformspezifischen Fragen und macht den Assistenten zur kurattierten Wissensdatenbank der Community.

## User-Prozess

1. Nutzer oeffnet den Orb-Chat (Klick auf den Cosmos Companion).
2. Nutzer tippt eine Frage, z.B. "Wie setze ich KI im Kundenservice ein?" oder "Was sind Best Practices fuer Prompt-Engineering?".
3. Das Chat-Panel sendet die Nachricht an `/api/ai/chat` (POST).
4. Der Server ruft `hybridSearchBestPractices` auf, erzeugt ein Embedding (OpenAI `text-embedding-3-small`) und fuehrt die Postgres-RPC-Funktion `hybrid_search_best_practices` aus.
5. Top-K-Ergebnisse werden dem LLM-Prompt als Kontext hinzugefuegt.
6. Der Orb streamt die Antwort Token fuer Token zurueck; der Orb-State wechselt auf "thinking".

## Einfachheit & Fuehrung

- Der RAG-Ablauf ist fuer den Nutzer unsichtbar — er stellt einfach eine Frage im Chat.
- Quick-Action-Chips ("Idee bewerten", "Zusammenfassen") geben Einstiegspunkte ohne eigene Formulierung.
- Kein separater "Suchen"-Button noetig; der Orb erkennt inhaltliche Fragen automatisch.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Hybrid-Search-Modul | `src/lib/search/hybrid-search.ts` |
| Hybrid-Search-API | `src/app/api/search/hybrid/route.ts` (POST) |
| Chat-API (RAG-Integration) | `src/app/api/ai/chat/route.ts` |
| Embedding-Service | `src/lib/ai/embeddings.ts` (OpenAI `text-embedding-3-small`, 1536-d) |
| SQL-Funktion | `hybrid_search_best_practices` RPC (Migration 00021 + 00026) |
| RLS-Sicherheit | `caller_id` wird an die RPC uebergeben; nur `status='published'` oder eigene Zeilen werden zurueckgegeben (Migration 00026 behebt den RLS-Leak aus dem Audit) |
| Telemetrie | Eintrag in `ai_call_logs` (fire-and-forget) |

**Suchalgorithmus:** Reciprocal Rank Fusion (RRF) kombiniert tsvector-Volltextranking (BM25-aequivalent) und pgvector Cosinus-Aehnlichkeit. Bei Embedding-Fehler Fallback auf reinen Volltext (`semantic_weight=0`).

**Zod-Schema der Hybrid-API:**

```text
POST /api/search/hybrid
Body: { query: string (max 2000), topK: int (1-30), weights?: { fullTextWeight, semanticWeight, rrfK } }
Auth: requireAuth() — 401 ohne Session
Rate-Limit: Tier "search" (30 req/60 s)
Feature-Guard: Feature-Flag "hybrid-search" muss aktiv sein (defaultEnabled: true)
```

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Hybrid-Search-Endpoint | Vollstaendig live |
| RLS-Schutz (caller_id) | Behoben in Migration 00026 |
| Chat-RAG-Integration | Live — `buildRagContext()` wird bei jedem Chat-Request aufgerufen (Task 5 in `route.ts:377`); Top-5 Best-Practice-Ergebnisse werden dem System-Prompt vorangestellt |
| Corpus-Umfang | Aktuell nur `best_practices`-Tabelle; Community-Posts, Kurse nicht indexiert |
| Embedding bei Privacy-Mode | Privacy-Mode leitet zum lokalen 384-d-Index um (inkompatibel mit dem 1536-d pgvector-Index — keine Cross-Mode-Suche) |

**Verwandte Entscheidungen:** [ADR-014](../architecture/adr/ADR-014-hybrid-search.md) · [../features/orb-chat-persistence.md](./orb-chat-persistence.md)
