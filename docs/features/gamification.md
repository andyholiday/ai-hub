# Gamification (Badges, Achievements, XP)

**Was es ist:** Ein schichtenweises Motivationssystem aus Experience Points (XP), 7 Levels, 20 Achievements in 4 Kategorien, 12 Community-Badges und taeglich erneuerbaren Streaks.

## Mehrwert / Benefit

Gamification macht Lernfortschritt messbar und belohnend. Jede Plattforminteraktion — vom Kommentar bis zum Kursabschluss — wird sichtbar bestaetigt. Das Streak-System haelt Nutzer taeglich zurueck; Achievements geben langfristige Ziele.

## User-Prozess

### XP sammeln

| Aktion | XP |
|--------|----|
| Kurslektion abschliessen | 25 |
| Community-Post erstellen | 15 |
| Challenge abschliessen | 100 |
| Kommentar schreiben | 5 |

XP-Fortschrittsbalken auf dem Dashboard zeigt den naechsten Level-Meilenstein.

### Level-System (7 Stufen)

| Level | Titel | XP-Schwelle |
|-------|-------|-------------|
| 1 | Neugieriger | 0 |
| 2 | KI-Entdecker | — |
| ... | ... | ... |
| 7 | KI-Visionaer | 10.000 |

Level-Titel und -Icon erscheinen auf Profil, Dashboard und im Leaderboard.

### Achievements (20 Stueck, 4 Kategorien)

- **Learning:** z.B. erster Kurs abgeschlossen, Lernpfad beendet
- **Community:** z.B. erster Post, 10 Kommentare, erste Upvotes erhalten
- **Innovation:** z.B. erste Idee eingereicht, KI-Bewertung angefordert
- **Engagement:** z.B. 7-Tage-Streak, Leaderboard-Top-10

Achievements erscheinen auf `/profile/achievements` mit Kategorie-Tabs; freigeschaltete sind farblich hervorgehoben, gesperrte ausgegraut. Teilweise freigeschaltete zeigen Fortschrittsbalken.

### Streaks

- Taeglich Login verlaengert den Streak-Counter.
- Tier-System aendert die Flammen-Farbe je nach Laenge.
- Laengste Streak wird dauerhaft gespeichert.

### Community-Badges (12 Stueck)

Beispiele: `first-post`, `commentator`, `influencer` — erscheinen neben dem Nutzernamen in Posts und auf dem Profil.

## Einfachheit & Fuehrung

- **Dashboard-Widgets:** XP-Fortschrittsbalken, Streak-Widget und letzte Achievements sind sofort sichtbar.
- **Orb-Celebration:** Bei Achievement-Freischaltung wechselt der Orb in den "celebration"-State mit Partikelexplosion.
- **XP-Animation** nach Lektionsabschluss gibt Sofortfeedback.
- **Feature-Flag:** `gamification` kann org-weit deaktiviert werden (kaskadiert `leaderboard` und zugehoerige Features aus).

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| XP-Vergabe | `src/lib/gamification/` — `update_xp()` Supabase-Funktion |
| Achievement-Check | `src/lib/gamification/achievements.ts` |
| Level-Berechnung | `calculate_level()` DB-Funktion |
| Achievements-Seite | `src/app/(dashboard)/profile/achievements/page.tsx` |
| Streak-Widget | `src/components/features/dashboard/` |
| Admin-Gamification-API | `src/app/api/admin/gamification/route.ts` |
| DB-Tabellen | `xp_log`, `achievements`, `user_achievements`, `user_badges`, `badges` |
| Migration | `00007_advanced_gamification.sql` (Achievements & Streaks) |
| Feature-Flag | `gamification` (defaultEnabled: true, orgToggleable) |

**Doppelvergabe-Schutz:** XP fuer Lektionsabschluss ist 3-fach abgesichert (DB-UNIQUE auf `user_lesson_progress`, Server-Check, Client-Guard).

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| XP & Level | Live |
| 20 Achievements | Live |
| 12 Community-Badges | Live |
| Streak-System | Live |
| Orb-Celebration-Integration | Live |
| XP-Doppelvergabe-Schutz | Live |
| Admin-Badge-Vergabe manuell | Via `/api/admin/gamification` |
| Gamification opt-out per Nutzer | Nicht live (nur org-weit via Feature-Flag) |
