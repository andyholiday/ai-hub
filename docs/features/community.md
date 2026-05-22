# Community

**Was es ist:** Ein zweiseitiges Community-Bereich: ein **Forum** fuer offene Diskussionen (Posts, verschachtelte Kommentare, Upvotes) und ein **Idea Board** fuer KI-Use-Case-Ideen mit Voting.

## Mehrwert / Benefit

Nutzer tauschen Erfahrungen aus, stellen Fragen und reichen KI-Ideen ein, die von der Community bewertet und von KI evaluiert werden. Jede Interaktion bringt XP und kann Badges freischalten — der soziale Aspekt verstaerkt das Lernen.

## User-Prozess

### Forum (`/community`)

1. Nutzer sieht eine gefilterte, sortierbare Post-Liste (Neueste / Beliebteste, Filter nach Typ und Tags).
2. Klick auf "Neuer Beitrag" oeffnet ein Formular fuer Titel, Inhalt und Tags.
3. Abgesenden speichert den Post und vergibt **15 XP** an den Autor.
4. Klick auf einen Post zeigt den Volltext mit Thread-Ansicht der Kommentare (bis 4 Ebenen tief).
5. Kommentar abschicken vergibt **5 XP**.
6. Upvote-Button ist ein Toggle (zweiter Klick entfernt den Vote); kein Self-Vote-XP (DB-Constraint).

### Idea Board (`/community/ideas`)

1. Grid-Layout aller Ideen mit Gold-Akzent-Cards.
2. Neue Idee einreichen via Formular.
3. Vote-Button gibt der Idee Punkte; Sortierung nach Neueste / Beliebteste / Hoechster Score.
4. KI-Bewertung ueber `/api/ai/evaluate` ist separat anforderbar (5 Dimensionen, Gesamtscore 0-100).

## Einfachheit & Fuehrung

- **Badges** (12 Stueck, z.B. `first-post`, `commentator`, `influencer`) erscheinen neben Nutzernamen und motivieren zur weiteren Teilnahme.
- **Orb-Reaktion:** Der Orb wechselt auf "celebration", wenn ein Achievement durch Community-Aktivitaet ausgeloest wird.
- **Pagination** ist vorhanden; die Liste zeigt immer den neuesten Inhalt oben.
- Leere Zustaende (keine Posts) sind mit einem Erstelle-CTA versehen.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Forum-Seite | `src/app/(dashboard)/community/page.tsx` |
| Post-Detail | `src/app/(dashboard)/community/[postId]/page.tsx` |
| Idea Board | `src/app/(dashboard)/community/ideas/page.tsx` |
| Posts-API | `src/app/api/community/posts/route.ts` |
| Comments-API | `src/app/api/community/posts/[postId]/comments/route.ts` |
| Votes-API | `src/app/api/community/posts/[postId]/vote/route.ts` |
| KI-Bewertung | `src/app/api/ai/evaluate/route.ts` + `src/lib/ai/use-case-evaluator.ts` |
| Gamification | `src/lib/gamification/` — XP-Vergabe, Achievement-Check |
| DB-Tabellen | `community_posts`, `post_comments`, `post_likes`, `badges`, `user_badges` |
| Feature-Flags | `forum` + `community-posts` (beide defaultEnabled: true) |

**N+1-Fix:** Die Posts-API laedt Autoren-Infos explizit via Join (kein `select("*")`), um Over-Fetching zu vermeiden.

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Posts erstellen / lesen / upvoten | Live |
| Kommentare (4 Ebenen) | Live |
| Idea Board + Voting | Live |
| KI-Bewertung von Ideen | Live |
| Auto-Tagging bei Post-Erstellung | Live via `/api/ai/auto-tag` |
| 12 Community-Badges | Live |
| Echtzeit-Updates (Supabase Realtime) | Nicht verdrahtet — Seite muss manuell neu geladen werden |
