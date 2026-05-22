# Learn Hub

**Was es ist:** Ein strukturierter Lernbereich (`/learn-hub`) mit Kursen, Lektionen, Multiple-Choice-Quizzes, Zertifikaten und kuratierten Lernpfaden.

## Mehrwert / Benefit

Nutzer koennen KI-Kompetenzen systematisch aufbauen: von einzelnen Lektionen ueber ganze Kurse bis zu vordefinierten Lernpfaden. Jeder Abschluss bringt XP, jeder Quiz gibt sofortiges Feedback, und Zertifikate machen den Fortschritt sichtbar.

## User-Prozess

### Kurs (`/learn-hub`)

1. Kurs-Grid mit Schwierigkeitsgrad-Filter und Fortschrittsbalken pro Kurs.
2. Klick oeffnet die Kurs-Detail-Seite mit Sidebar-Lektionsliste.
3. Lektion aufrufen: Markdown-Inhalt wird via DOMPurify bereinigt als HTML gerendert.
4. "Lektion abschliessen" vergibt **25 XP** (3-fach abgesichert gegen doppelte Vergabe: DB-Constraint, Server-Check, Client-Guard).
5. Wenn eine Lektion ein Quiz enthaelt: Multiple-Choice-Fragen mit Sofort-Feedback; bestanden bei >= 70%.
6. Nach allen Lektionen: Zertifikat wird automatisch generiert.

### Lernpfade (`/learn-hub/paths`)

1. Lernpfad-Cards zeigen Kurs-Anzahl und geschaetzte Dauer.
2. "Einschreiben" aktiviert den Pfad-Fortschritt.
3. Stepper-Timeline zeigt die Kursreihenfolge; abgeschlossene Kurse werden markiert.
4. Progress-Bar aktualisiert sich nach jedem abgeschlossenen Kurs im Pfad.

## Einfachheit & Fuehrung

- **Fortschrittsbalken** auf der Uebersichtsseite zeigt, welche Kurse schon begonnen wurden.
- **Sidebar-Navigation** in der Kurs-Detailseite listet alle Lektionen mit Status (offen / abgeschlossen).
- **Sofort-Feedback** beim Quiz reduziert Unsicherheit.
- **XP-Animation** nach Lektionsabschluss belohnt visuell sofort.
- 3 Seed-Kurse und 3 Seed-Lernpfade sind ab Installation vorhanden.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Kurs-Uebersicht | `src/app/(dashboard)/learn-hub/page.tsx` |
| Kurs-Detail | `src/app/(dashboard)/learn-hub/[courseId]/page.tsx` |
| Lektion | `src/app/(dashboard)/learn-hub/[courseId]/[lessonId]/page.tsx` |
| Lernpfade | `src/app/(dashboard)/learn-hub/paths/page.tsx` |
| Lernpfad-Detail | `src/app/(dashboard)/learn-hub/paths/[pathId]/page.tsx` |
| Kurse-API | `src/app/api/learn-hub/courses/route.ts` |
| Lektions-Fortschritt-API | `src/app/api/learn-hub/lessons/[lessonId]/complete/route.ts` |
| XSS-Schutz | `src/lib/utils/sanitize.ts` (DOMPurify) |
| DB-Tabellen | `courses`, `lessons`, `quizzes`, `user_lesson_progress`, `course_certificates`, `learning_paths`, `learning_path_courses`, `user_learning_path_progress` |
| Feature-Flag | `learn-hub` (defaultEnabled: true, userToggleable) |

**Query-Optimierung:** Kurse werden mit parallelen Queries geladen (kein sequentielles N+1); Fortschrittsdaten per Join.

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Kurse & Lektionen | Live |
| Quizzes mit Sofort-Feedback | Live |
| Zertifikate | Live (automatisch nach letzter Lektion) |
| XP-Doppelvergabe-Schutz | Live (3-fach abgesichert) |
| Lernpfade & Enrollment | Live |
| Lernpfad-Fortschritt | Live |
| AI-generierte Lektionsinhalte | Nicht live — Inhalte sind manuell befuellt |
| Kurs-Empfehlungen durch Orb | Moeglich via AI Mentor; kein automatischer Kurs-Vorschlag im Learn-Hub |
