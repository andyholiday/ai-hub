# Privacy-Mode & Lokale Suche

**Was es ist:** Wenn der Nutzer Privacy-Mode aktiviert, werden alle Suchembeddings im Browser selbst erzeugt (384-d, `all-MiniLM-L6-v2` via Transformers.js) und alle KI-Antworten ueber Mistral EU (Frankreich, DSGVO-Datenschutzvereinbarung vorhanden) statt ueber US-Cloud-Provider geroutet. Keine Suchanfrage verlaesst den Browser.

## Mehrwert / Benefit

Nutzer oder Organisationen mit strengen Datenschutzanforderungen koennen die Plattform nutzen, ohne Suchqueries an OpenAI oder andere US-Provider zu senden. Die Suche funktioniert vollstaendig offline (nach dem ersten Modell-Download), und der Chat bleibt EU-datenschutzkonform.

## User-Prozess

1. Nutzer navigiert zu **Einstellungen** (`/settings`).
2. In der Feature-Settings-Sektion aktiviert der Nutzer "Privacy Mode" (Toggle).
3. Ab sofort:
   - Command-Palette-Suche laeuft lokal (kein HTTP-Request an `/api/search/hybrid`).
   - Das Transformers.js-Modell wird beim ersten Oeffnen der Palette geladen (Fortschrittsanzeige via `LocalSearchIndex.progress`).
   - Orb-Chat-Anfragen werden ueber Mistral EU (`mistral-small-latest`, FR-Region) geroutet.
4. Nutzer kann Privacy-Mode jederzeit wieder deaktivieren.

## Einfachheit & Fuehrung

- **Einmaliger Download:** Das 384-d-Modell (`all-MiniLM-L6-v2`) wird beim ersten Privacy-Mode-Start heruntergeladen und gecacht. Folgeaufrufe sind sofort bereit.
- **Graceful Degradation:** Wenn das Modell noch laedt (`status: 'local-loading'`), zeigt die Palette einen Lade-Spinner; ist es im Fehlerzustand, faellt die Suche auf einen einfachen Substring-Filter zurueck — kein leerer Zustand.
- **Transparenz:** Feature-Settings zeigen alle aktiven Feature-Flags, sodass der Nutzer weiss, was gerade gilt.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Lokaler Such-Index | `src/lib/search/local-search.ts` |
| Lokaler Embedding-Service | `src/lib/ai/local-embeddings.ts` (Transformers.js Worker) |
| Privacy-Mode-Hook | `src/hooks/use-privacy-mode.ts` |
| Command-Palette-Integration | `src/components/shared/command-palette.tsx` |
| EU-LLM-Provider | `src/lib/ai/providers/mistral-eu.ts` |
| AI Router (Privacy-Branch) | `src/lib/ai/router.ts` — prueft `request.privacyMode` vor der Fallback-Chain |
| Feature-Flags | `privacy-mode` (defaultEnabled: false) + `privacy-local-embeddings` (defaultEnabled: false) |
| Settings-Seite | `src/app/(dashboard)/settings/page.tsx` → `FeatureSettingsPage` |

**Wichtig — Vektordimension-Isolation:** Die lokalen 384-d-Vektoren duenrfen NICHT mit dem serverseitigen 1536-d pgvector-Index verglichen werden. `LocalSearchIndex` und der Hybrid-Search-Server verwenden vollstaendig getrennte Indizes.

**EU-LLM-Caveat (ADR-013):** Mistral Experiment-Tier ist kostenlos, aber dessen Trainingsdaten-Ausschlussklausel muss beachtet werden — Produktionsdaten sollten auf einen bezahlten Mistral-Plan migriert werden.

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Privacy-Mode-Toggle in Settings | Live |
| Lokaler Embedding-Service (Transformers.js) | Live |
| Lokale Suche in der Command-Palette | Live, aber Corpus ist Demo-Stub (6 Eintraege) |
| Mistral EU Routing bei aktivem Privacy-Mode | Live (ADR-013) |
| User-Feature-Prefs in Supabase | Schema vorhanden (Migration 00023), UI-Persistenz per Zustand-Store |
| Corpus automatisch aus Datenbank befuellt | Nicht live — statisch hardcodiert |
| Mistral Experiment-Tier Trainingsdaten-Ausschluss | Noch nicht produktionsreif (siehe ADR-013-Caveats) |

**Verwandte Entscheidungen:** [ADR-010](../architecture/adr/ADR-010-privacy-local-embeddings.md) · [ADR-013](../architecture/adr/ADR-013-mistral-eu-privacy-llm.md)
