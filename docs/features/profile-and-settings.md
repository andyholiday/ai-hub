# Profil & Einstellungen

**Was es ist:** Zwei zusammengehoerende Bereiche: das **Profil** (`/profile`) als oeffentliche Selbstdarstellung mit Stats und Achievements, und **Einstellungen** (`/settings` + `/profile/settings`) fuer persoenliche Optionen wie Dark Mode, Privacy Mode und Feature-Praeferenzen.

## Mehrwert / Benefit

Das Profil gibt Nutzern Sichtbarkeit in der Community und einen Ort, an dem der eigene Fortschritt zusammengefasst ist. Einstellungen geben Kontrolle ueber das Erlebnis — insbesondere ueber datenschutzrelevante Features wie Privacy Mode und Leaderboard-Sichtbarkeit.

## User-Prozess

### Profil

1. Nutzer navigiert zu `/profile`.
2. Anzeige: Name, E-Mail, Level, XP, Badges, Stats (Posts, Kommentare, Kurse, Achievements).
3. Alle Daten kommen aus Supabase (nicht Demo-Daten).
4. Sub-Route `/profile/achievements` zeigt alle 20 Achievements mit Kategorie-Tabs; freigeschaltete sind hervorgehoben.
5. Sub-Route `/profile/settings` ermoeglicht das Aendern von `full_name`, `bio`, `department`, `position`; Formular ist mit aktuellen Daten vorbefuellt; Aenderungen werden in Supabase gespeichert; Erfolgsmeldung nach dem Speichern.

### Einstellungen

1. Nutzer navigiert zu `/settings`.
2. **Feature-Settings-Sektion** (`FeatureSettingsPage`): Toggles fuer user-toggleable Features (Privacy Mode, Leaderboard-Sichtbarkeit, Living Orb, Orb-Animationen, Learn Hub, AI Mentor).
3. Aenderungen werden in `user_feature_prefs` gespeichert (Migration 00023).
4. **Dark Mode:** UI-Toggle vorhanden und funktional fuer App-Shell und UI-Primitives; viele Feature-Seiten noch nicht konvertiert.

## Einfachheit & Fuehrung

- **Vorbefuellte Formulare** in den Profil-Settings ersparen das erneute Eintippen aller Daten.
- **Kategorie-Tabs** in den Achievements-Uebersicht machen 20 Achievements uebersichtlich.
- **Feature-Toggles** mit Beschriftungen erklaeren, was jedes Feature macht — kein technisches Vorwissen noetig.
- **Erfolgs-Toast** bestaetigt gespeicherte Aenderungen.

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Profil-Seite | `src/app/(dashboard)/profile/page.tsx` |
| Achievements-Seite | `src/app/(dashboard)/profile/achievements/page.tsx` |
| Profil-Settings | `src/app/(dashboard)/profile/settings/page.tsx` |
| Einstellungen | `src/app/(dashboard)/settings/page.tsx` (Server Component) |
| Feature-Settings-Komponente | `src/components/features/settings/feature-settings-page.tsx` |
| Profil-API | `src/app/api/user/profile/route.ts` (GET/PATCH) |
| User-Prefs-API | `src/app/api/user/feature-prefs/route.ts` |
| DB-Tabellen | `profiles`, `user_achievements`, `user_badges`, `user_feature_prefs` |
| Feature-Flag | `leaderboard` (userToggleable: true), `privacy-mode` (userToggleable: true) |

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Profil anzeigen (echte Daten) | Live |
| Profil bearbeiten (Name, Bio, etc.) | Live |
| Achievements-Seite | Live |
| Feature-Toggles in Einstellungen | Live (UI + DB-Persistenz) |
| Avatar-Upload | Nicht live |
| Dark Mode | Live fuer App-Shell und UI-Primitives; viele Feature-Seiten noch nicht konvertiert (Follow-up, kein Blocker) |
| Passwort aendern | Via Forgot-Password-Flow (`/forgot-password`) |
| Account loeschen (GDPR-Erasure) | Vorhanden via `/api/user/erasure` (siehe [gdpr-erasure.md](./gdpr-erasure.md)) |
