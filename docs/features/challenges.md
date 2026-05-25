# Challenges

**Was es ist:** Zeitbasierte Herausforderungen (`/challenges`), bei denen Nutzer sich fuer Aufgaben anmelden, Fortschritt melden und bei Abschluss XP-Belohnungen erhalten.

## Mehrwert / Benefit

Challenges erzeugen einen regelmaessigen Anreiz, die Plattform aktiv zu nutzen. Sie foerdern Wettbewerb und soziale Sichtbarkeit (Teilnehmer-Liste) und sind eine klar abgegrenzte, motivierende Aufgabe — im Gegensatz zum offenen Lernen im Learn Hub.

## User-Prozess

1. Nutzer navigiert zu `/challenges`.
2. Liste aller Challenges mit Status-Filter (aktiv / abgeschlossen), Zeitraum, Belohnung und Kurzbeschreibung.
3. Klick oeffnet die Challenge-Detail-Seite (`/challenges/[challengeId]`).
4. "Beitreten" schreibt den Nutzer fuer die Challenge ein.
5. Fortschritt kann gemeldet werden (Fortschritts-Tracking-UI).
6. Bei Abschluss: **100 XP** Belohnung und ggf. Achievement-Freischaltung.

## Einfachheit & Fuehrung

- **Status-Filter** trennt aktive von abgeschlossenen Challenges; der Nutzer sieht immer, was gerade relevant ist.
- **Zeitraum-Anzeige** (Start/Ende) gibt Dringlichkeit.
- **Teilnehmer-Liste** in der Detail-Ansicht schafft sozialen Kontext.
- **Orb-Reaktion:** Bei Abschluss einer Challenge wechselt der Orb in den "celebration"-State.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Challenges-Seite | `src/app/(dashboard)/challenges/page.tsx` |
| Challenge-Detail | `src/app/(dashboard)/challenges/[challengeId]/page.tsx` |
| Challenges-API | `src/app/api/challenges/route.ts` |
| Beitritt-API | `src/app/api/challenges/[challengeId]/join/route.ts` |
| Fortschritts-API | `src/app/api/challenges/[challengeId]/progress/route.ts` |
| XP-Vergabe | `src/lib/gamification/` |
| DB-Tabellen | `challenges`, `user_challenges` |

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Challenge-Liste & Detail | Live |
| Beitritt & Fortschritt | Live |
| XP-Vergabe (100 XP) | Live |
| Admin-Erstellung neuer Challenges | Via Admin Content-Bereich (Moderations-UI vorhanden) |
| Echtzeitanzeige des Fortschritts anderer Teilnehmer | Nicht live |
