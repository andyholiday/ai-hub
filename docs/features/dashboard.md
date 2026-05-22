# Dashboard

**Was es ist:** Die zentrale Einstiegsseite (`/dashboard`) nach dem Login — eine persoenliche Uebersicht mit XP-Stand, Streak, letzten Achievements, personalisierten Empfehlungen und einem Aktivitaets-Feed.

## Mehrwert / Benefit

Das Dashboard gibt Nutzern in wenigen Sekunden einen vollstaendigen Ueberblick ueber ihren aktuellen Stand und leitet sie zu den naechsten sinnvollen Aktionen. Es ist die Antwort auf "Was mache ich als Naechstes?" — durch echte Daten, nicht Dummy-Content.

## User-Prozess

1. Nutzer loggt sich ein und landet auf `/dashboard`.
2. **Stats-Grid** (oben) zeigt XP-Gesamtpunkte, aktuellen Level (mit Titel), Streak-Tage.
3. **XP-Fortschrittsbalken** zeigt den Abstand zum naechsten Level.
4. **Streak-Widget** mit Flammen-Animation und Tier-Farbe; laengste Streak wird angezeigt.
5. **Letzte Achievements** — Cards mit Icon, Name, Datum der Freischaltung.
6. **Personalisierte Empfehlungen** — KI-generierte Vorschlaege aus 5 Datenquellen (Kurse, Best Practices, Posts, Challenges, Ideen); Klick fuehrt direkt zur jeweiligen Seite.
7. **Aktivitaets-Feed** — chronologischer Feed der neuesten Community-Aktivitaeten.
8. Der Orb begruesst den Nutzer beim ersten Aufruf nach Login ("greeting"-State, 3s).

## Einfachheit & Fuehrung

- **Keine leere Seite:** Selbst bei einem neuen Konto zeigen Seed-Daten, was moeglich ist.
- **Empfehlungs-Widget** leitet den Nutzer proaktiv zur naechsten Aktion — keine eigene Entscheidung noetig.
- **Orb-Begruessing** schafft einen persoenlichen Einstieg.
- **Server Component fuer Metadaten:** Die Seite ist performant — das JS-Bundle ist minimal, die Daten werden serverseitig geladen.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Seite | `src/app/(dashboard)/dashboard/page.tsx` (Server Component fuer Metadata) |
| Dashboard-Inhalt | `src/components/features/dashboard/` (`DashboardContent`, `DashboardDataProvider`) |
| Stats-API | `src/app/api/user/stats/route.ts` |
| Empfehlungs-API | `src/app/api/recommendations/route.ts` |
| Aktivitaets-Feed-API | `src/app/api/activity/route.ts` |
| Achievement-Widget | `src/components/features/dashboard/recent-achievements.tsx` |
| Streak-Widget | `src/components/features/dashboard/streak-widget.tsx` |
| DB-Tabellen | `profiles` (xp_total, level), `xp_log`, `user_achievements`, `activity_log` |

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Stats-Grid (XP, Level, Streak) | Live |
| Personalisierte Empfehlungen | Live (5 Quellen) |
| Letzte Achievements | Live |
| Aktivitaets-Feed | Live |
| Orb-Begruessing | Live |
| Dark Mode | Live fuer App-Shell und UI-Primitives; diese Seite noch nicht vollstaendig konvertiert (Follow-up) |
| Echtzeit-Aktualisierung des Feeds | Nicht live — manuelles Neuladen noetig |
