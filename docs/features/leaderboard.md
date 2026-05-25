# Leaderboard

**Was es ist:** Eine Rangliste der aktivsten Plattform-Nutzer nach gesammelten XP, filterbar nach Zeitraum (Woche / Monat / Gesamt), mit Podest-Darstellung fuer die Top 3.

## Mehrwert / Benefit

Der soziale Vergleich motiviert Nutzer, regelmaessig XP zu sammeln und ihren Rang zu verbessern. Die eigene Position ist immer sofort sichtbar — inklusive des XP-Abstands zum naechsten Platz.

## User-Prozess

1. Nutzer navigiert zu `/leaderboard`.
2. Rangliste zeigt Platz, Name, XP, Level und Badges der Teilnehmer.
3. Top 3 erscheinen als Podest (Gold / Silber / Bronze).
4. Eigene Zeile ist farblich hervorgehoben; XP-Abstand zum naechsten Platz sichtbar.
5. Perioden-Filter (Tabs: Woche / Monat / Gesamt) laed aktualisierte Daten aus Supabase.

## Einfachheit & Fuehrung

- **Eigenes Ranking direkt sichtbar:** Keine Suche noetig — der eigene Eintrag ist hervorgehoben.
- **Orb-State:** Auf der Leaderboard-Seite wechselt der Orb in den "energized"-State ("Du bist auf Feuer!").
- **Feature-Flag:** `leaderboard` ist user-toggleable; Nutzer die nicht erscheinen wollen koennen es in den Einstellungen deaktivieren.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Seite | `src/app/(dashboard)/leaderboard/page.tsx` |
| Leaderboard-API | `src/app/api/leaderboard/route.ts` |
| DB-View | Supabase-View `leaderboard` (aggregiert `profiles.xp_total`) |
| Feature-Flag | `leaderboard` (defaultEnabled: true, userToggleable, abhaengig von `gamification`) |

**Perioden-Filterung:** Die API nimmt einen `period`-Parameter (`week` / `month` / `all`); wochentliche und monatliche Abfragen verwenden `created_at`-Fenster auf `xp_log`.

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Rangliste (Gesamt) | Live |
| Perioden-Filter (Woche / Monat) | Live |
| Eigene Hervorhebung | Live |
| Opt-Out via Feature-Flag | Live |
| Anonymisierter Modus | Nicht live |
