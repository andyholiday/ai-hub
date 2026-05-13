---
id: ADR-014
title: "Postgres-Native Hybrid Search via tsvector + pgvector + RRF"
status: Accepted
date: 2026-05-07
tags:
  - search
  - hybrid-search
  - postgres
  - pgvector
  - supabase
  - rrf
---

# ADR-014: Postgres-Native Hybrid Search via tsvector + pgvector + Reciprocal Rank Fusion

**Status:** Accepted
**Datum:** 2026-05-07

---

## Kontext

Pattern P1.1 (Hybrid Search) soll Keyword-Suche und semantische Vektorsuche kombinieren,
um sowohl exakte Treffer als auch thematisch verwandte Inhalte abzudecken. Die v3-Planung
sah urspruenglich Typesense 0.26 als dedizierte Such-Engine vor — in Kombination mit dem
bestehenden pgvector-HNSW-Index fuer Re-Ranking.

Typesense Cloud Hobby kostet $15/Monat und fuehrt einen weiteren Netzwerksprung sowie
eine DSGVO-relevante Datenweitergabe (Supabase -> Typesense) ein. Supabase dokumentiert
seit 2024 offiziell einen Hybrid-Search-Pfad, der vollstaendig in Postgres laeuft:
`tsvector` fuer Full-Text-Search (FTS), `pg_trgm` fuer Trigram-Fuzzy-Matching und `pgvector`
fuer semantische Aehnlichkeit, kombiniert via Reciprocal Rank Fusion (RRF) in einer
einzigen SQL-Funktion `hybrid_search()`. Dieser Ansatz erfordert keinen externen Dienst.

Die bestehende Codebase hat bereits einen pgvector HNSW-Index auf `best_practices.embedding`
sowie GIN/Trigram-Indexes auf Tags und Title. Eine `tsvector`-Spalte fehlt noch, ist aber
mit einer Migration ergaenzbar. Der `hybrid_search()`-API-Aufruf aus dem bestehenden
`src/app/api/ai/search/route.ts` erfordert minimale Aenderungen.

---

## Entscheidung

Wir implementieren Hybrid Search vollstaendig in Supabase Postgres ohne externen Such-Dienst.
Die Loesung besteht aus drei Teilen:

1. **Schema-Erweiterung:** `tsvector`-Spalte mit GIN-Index auf der durchsuchbaren Tabelle
   (naechste freie Migrationsnummer wird in Wave 1/2 vergeben; Konkrete Nummer liegt beim
   Developer-Agent). `pg_trgm`-Extension sofern noch nicht aktiv.

2. **SQL-Funktion `hybrid_search()`:** Nimmt `query_text` (text), `query_embedding` (vector),
   `match_count` (int), optionale Gewichte `full_text_weight` und `semantic_weight` sowie
   `rrf_k` (smoothing constant, Default 50). Gibt Datensaetze sortiert nach RRF-Score zurueck:
   Score = `1/(rrf_k + fts_rank) + 1/(rrf_k + semantic_rank)`. Beide Sub-Queries laufen
   unabhaengig gegen ihre jeweiligen Indexes; RRF-Merge in der aeusseren Query.

3. **API-Anpassung:** `src/app/api/ai/search/route.ts` ruft `hybrid_search()` via Supabase
   RPC-Call auf statt der bisherigen reinen Vektor-Similarity-Suche.

---

## Konsequenzen

**Positiv**
- 0 €/Monat gegenueber $15/Monat (Typesense Cloud Hobby) — Ersparnis ~$180/Jahr.
- Kein Netzwerksprung: Suche laeuft in derselben Postgres-Instanz wie alle anderen Queries
  — erwartete Latenz unter 50 ms statt ~100–150 ms mit externem Dienst.
- DSGVO-Vorteil: Keine Datenweitergabe an Typesense; alle Suchdaten verbleiben in Supabase.
- Offiziell dokumentierter Pfad (Supabase Docs, https://supabase.com/docs/guides/ai/hybrid-search)
  — kein Experimental-Status, Long-Term-Support zu erwarten.
- HNSW-Index fuer semantische Suche bereits vorhanden — halbiert den Migrations-Aufwand.
- Pattern-P1.1-Aufwand sinkt von M (3–5 Tage) auf S (1–2 Tage).

**Negativ**
- `tsvector`-Ranking ist kein echtes BM25: IDF (Inverse Document Frequency) ueber den
  gesamten Corpus fehlt. Bei sehr grossen Corpora oder fachspezifischen Vokabularen
  koennen Keyword-Rankings von BM25 abweichen. Fuer den aktuellen Corpus-Umfang (best-practices,
  community-content) ist dieser Trade-off akzeptabel.
- Supabase Free-Tier hat Compute-Limiten — sehr komplexe Hybrid-Queries koennen bei
  gleichzeitiger Last paused werden. Monitoring notwendig.
- Kein eingebautes Faceting oder Typo-Toleranz wie bei Typesense. `pg_trgm` bietet
  Fuzzy-Matching, ist aber kein vollwertiger Ersatz fuer das UX-Feature "did you mean?".

**Neutral**
- `hybrid_search()`-SQL-Funktion muss in einer Migration angelegt und versioniert werden.
  Migrationsnummer wird in Wave 1/2 vergeben (naechste freie Nummer nach aktuell `00020+`).
- Realtime-Sync via Supabase-Listener entfaellt (Suchdaten leben ohnehin nativ in Postgres).
- MiniSearch (Client-Side) bleibt als ergaenzender Spike moeglich fuer Offline-Szenarien,
  ist aber kein Ersatz fuer Server-Side Hybrid Search.

---

## Alternativen Abgewogen

### Alternative A: Typesense Cloud Hobby ($15/Mo)
- Zusammenfassung: Dedizierte Such-Engine mit BM25, Faceting, Typo-Toleranz, Instant-Search.
- Abgelehnt weil: $15/Monat Fixkosten, zusaetzliche Datenweitergabe (DSGVO-Risiko),
  Netzwerksprung-Latenz und Sync-Overhead zwischen Supabase und Typesense;
  unverhältnismaessig fuer aktuellen Traffic und Budget.

### Alternative B: Algolia Free Tier
- Zusammenfassung: Marktfuehrendes Such-SaaS mit hervorragender DX, Free-Tier verfuegbar.
- Abgelehnt weil: Inaktivitaets-Loeschung nach 60 Tagen (unakzeptabel fuer Produktionsdaten),
  US-Infrastruktur (DSGVO-Drittland-Transfer), bei Wachstum teuer.

### Alternative C: ParadeDB `pg_search`-Extension
- Zusammenfassung: Echtes BM25 direkt in Postgres als Extension, kein externer Dienst.
- Abgelehnt weil: `pg_search` ist auf Supabase Cloud nicht verfuegbar (nur Self-Hosted
  Postgres); loest das Deployment-Problem nicht im aktuellen Stack.

### Alternative D: MiniSearch (Client-Side)
- Zusammenfassung: Leichtgewichtige JS-Such-Library, laeuft im Browser ohne Server-Roundtrip.
- Abgelehnt als Primaer-Loesung weil: Skaliert nicht mit Corpus-Groesse (gesamter Index
  muss zum Client uebertragen werden); keine semantische Suche; ergaenzender Spike
  bleibt moeglich, ersetzt aber Hybrid Search nicht.

---

## References

- Supabase Hybrid Search Dokumentation: https://supabase.com/docs/guides/ai/hybrid-search
- ParadeDB Hybrid Search Manual (Hintergrundlektuere BM25 vs tsvector):
  https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual
- Bestehende Such-Route: `src/app/api/ai/search/route.ts`
- Bestehendes Schema: pgvector HNSW-Index auf `best_practices.embedding`,
  GIN/Trigram auf Tags + Title
- Plan-v3 Pattern: `docs/IMPLEMENTATION-PLAN-V3.md`, Säule 1, Pattern P1.1
- Innovator-Output: Wave-0a Multi-Agent Re-Eval (2026-05-07)

## Revisions

- 2026-05-07: initial version
