# Innovation Radar

**Was es ist:** Eine interaktive SVG-Visualisierung (`/innovation-radar`) von KI-Technologien und -Themen, geordnet in 4 Ringe (Adopt / Trial / Assess / Hold) und 4 Quadranten (Techniques / Tools / Platforms / Frameworks).

## Mehrwert / Benefit

Der Innovation Radar bietet einen strukturierten Ueberblick ueber den Stand relevanter KI-Technologien — aehnlich dem Thoughtworks Technology Radar. Nutzer sehen auf einen Blick, was die Community empfiehlt sofort einzusetzen (Adopt), was erprobt werden sollte (Trial) und was noch beobachtet wird (Assess / Hold).

## User-Prozess

1. Nutzer navigiert zu `/innovation-radar`.
2. SVG-Radar laedt dynamisch (Code-Split fuer Performance).
3. Themen erscheinen als Punkte auf dem Radar positioniert nach Ring und Quadrant.
4. Klick auf einen Punkt oder einen Eintrag in der Sidebar zeigt die Detail-Card (Titel, Beschreibung, Ring-Erklaerung, Trend-Richtung).
5. Suchfeld in der Sidebar filtert Themen in Echtzeit.
6. Quadrant-Filter schraenkt die Ansicht auf eine Technologie-Kategorie ein.
7. "Trending Topics"-Sektion zeigt die 5 meistdiskutierten Themen.

## Einfachheit & Fuehrung

- **Sidebar** gibt eine Listenansicht fuer Nutzer, die lieber lesen als eine Visualisierung erkunden.
- **Detail-Card** erklaert nicht nur den Ring (was), sondern auch den Grund (warum in diesem Ring) — ohne Fachkenntnis verstaendlich.
- **Trending-Sektion** lenkt Aufmerksamkeit auf das, was die Community gerade bewegt.
- **Dynamic Import** haelt den initialen Bundle klein; der Radar laedt nur wenn die Seite aufgerufen wird.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Seite | `src/app/(dashboard)/innovation-radar/page.tsx` |
| Radar-Chart (SVG) | `src/components/features/innovation-radar/` (dynamic import) |
| Topics-API | `src/app/api/innovation-radar/topics/route.ts` |
| Voting-API | `src/app/api/innovation-radar/topics/[topicId]/vote/route.ts` |
| DB-Tabellen | `radar_topics`, `topic_votes` |
| Feature-Flag | `innovation-radar` (defaultEnabled: true, orgToggleable) |

**Performance:** Der SVG-Chart wird via `next/dynamic` ohne SSR geladen, damit der schwere Rendering-Code nicht im initialen Bundle landet.

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| SVG-Radar-Visualisierung | Live |
| Topic-Sidebar mit Suche und Filter | Live |
| Detail-Card | Live |
| Trending Topics | Live |
| Topic-Voting | Live |
| Admin-Erstellung neuer Themen | Via Admin Content-Bereich |
| Automatische Themen-Generierung durch KI | Nicht live |
