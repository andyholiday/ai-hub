# Best Practices

**Was es ist:** Eine kuratierte Wissensdatenbank (`/best-practices`) mit Artikeln zu KI-Einsatzszenarien, semantisch durchsuchbar und mit automatischem KI-Tagging.

## Mehrwert / Benefit

Nutzer finden praxiserprobte Antworten auf konkrete KI-Fragen — ohne lange zu googeln. Die semantische Suche findet relevante Artikel auch ohne exakte Schluesselwoerter, und der Innovation Radar und die Command-Palette verlinken direkt auf passende Best Practices.

## User-Prozess

1. Nutzer navigiert zu `/best-practices`.
2. Artikel-Grid mit Filtern nach Kategorie, Schwierigkeitsgrad und Tags.
3. Suchfeld nutzt semantische Suche (wenn `hybrid-search` aktiv) oder Volltext.
4. Klick auf einen Artikel oeffnet die Detail-Seite (`/best-practices/[id]`): Markdown-Inhalt, DOMPurify-bereinigt, mit Tags, Autor, Views, Upvotes und Kommentaren.
5. Nutzer kann einen neuen Artikel einreichen (`/best-practices/new`).
6. Beim Speichern wird Auto-Tagging via `/api/ai/auto-tag` angestossen.

## Einfachheit & Fuehrung

- **Semantische Suche** findet Artikel auch bei umgangssprachlichen oder inhaltlich verwandten Begriffen.
- **Auto-Tags** machen neue Artikel sofort auffindbar, ohne dass der Autor Tags manuell pflegen muss.
- **XSS-Schutz** via DOMPurify sorgt dafuer, dass Nutzer-formatierter HTML-Inhalt sicher gerendert wird.
- **Command-Palette** (Cmd/Ctrl+K) durchsucht Best Practices von jeder Seite aus.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Uebersicht | `src/app/(dashboard)/best-practices/page.tsx` |
| Detail | `src/app/(dashboard)/best-practices/[id]/page.tsx` |
| Erstellen | `src/app/(dashboard)/best-practices/new/page.tsx` |
| Best-Practices-API | `src/app/api/best-practices/route.ts` |
| Semantische Suche | `src/app/api/search/route.ts` (POST) → `lib/search/hybrid-search.ts` |
| Auto-Tagging | `src/app/api/ai/auto-tag/route.ts` + `src/lib/ai/auto-tagger.ts` |
| XSS-Bereinigung | `src/lib/utils/sanitize.ts` (DOMPurify) |
| DB-Tabellen | `best_practices`, `best_practice_tags`, `content_embeddings` |
| Feature-Flag | `best-practices` (defaultEnabled: true, orgToggleable) |

**Embedding-Erstellung:** Beim Speichern eines neuen Artikels wird ein Embedding (OpenAI `text-embedding-3-small`, 1536-d) generiert und in `content_embeddings` gespeichert, damit der Artikel per pgvector-Suche findbar ist.

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Artikel lesen / filtern | Live |
| Semantic Search (hybrid) | Live (Feature-Flag `hybrid-search` aktiv) |
| Auto-Tagging | Live |
| Neuen Artikel erstellen | Live |
| RLS (nur eigene Entwuerfe sichtbar, Fremde nur published) | Live (Migration 00026 behebt RLS-Leak) |
| Kommentare auf Best-Practice-Artikeln | Nicht live |
| Admin-Moderations-Workflow (Entwurf → Published) | Via Admin Content-API (`/api/admin/content`) |
