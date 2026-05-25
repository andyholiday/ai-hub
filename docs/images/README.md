# Screenshot-Manifest

Dieses Verzeichnis enthaelt alle visuellen Assets fuer die Projektdokumentation.

## Anleitung fuer Screenshots

Viewport-Einstellung: **1440 x 900 px**, DevTools in Chromium (oder Playwright-Screenshot-Script).
Falls sensible Daten (E-Mail-Adressen, echte API-Keys) sichtbar sind, vor dem Screenshot maskieren
oder Demo-Daten verwenden. Bilder als `.png` speichern, Dateinamen exakt wie in der Tabelle.

Fuer Dark-Mode-Vergleiche: Light-Screenshot zuerst, dann Dark-Mode via Toggle in `/settings`
aktivieren und gleiche Route erneut aufnehmen.

## Screenshots

| Dateiname | Route + Interaktion | Empfohlene Aufloesung | Verwendet in |
|-----------|--------------------|-----------------------|--------------|
| `dashboard.png` | `/dashboard` nach Login, alle Widgets sichtbar (XP-Balken, Streak, Achievements, Empfehlungen) | 1440x900 | SHOWCASE.md, features/dashboard.md |
| `orb-chat.png` | `/dashboard` mit geoeffnetem Chat-Panel (ChatSplitView 50/50), Nachricht im Verlauf sichtbar | 1440x900 | SHOWCASE.md, features/ai-orb-companion.md |
| `orb-bubble.png` | `/dashboard` mit proaktiver Sprechblase am Orb (Feature-Flag `proactive-orb-bubble` aktivieren) | 1440x900 | features/ai-orb-companion.md |
| `command-palette.png` | Beliebige Dashboard-Seite, Cmd+K gedrueckt, Suchergebnisse sichtbar | 1440x900 | SHOWCASE.md, features/command-palette-search.md |
| `dark-mode-side-by-side.png` | Dashboard Light (links) und Dark (rechts) nebeneinander | 2880x900 | SHOWCASE.md |
| `learn-hub.png` | `/learn-hub` Kurs-Grid mit Fortschrittsbalken, mindestens ein Kurs angefangen | 1440x900 | SHOWCASE.md, features/learn-hub.md |
| `community-feed.png` | `/community` mit Post-Liste, Kommentaren und Badges neben Nutzernamen | 1440x900 | SHOWCASE.md, features/community.md |
| `gamification.png` | `/profile/achievements` mit Kategorie-Tabs und freigeschalteten Achievements | 1440x900 | SHOWCASE.md, features/gamification.md |
| `leaderboard.png` | `/leaderboard` mit Podest (Top 3) und hervorgehobener eigener Zeile | 1440x900 | SHOWCASE.md, features/leaderboard.md |
| `best-practices-list.png` | `/best-practices` mit Filter, Artikel-Cards und Suche | 1440x900 | SHOWCASE.md, features/best-practices.md |
| `innovation-radar.png` | `/innovation-radar` SVG-Radar vollstaendig sichtbar mit ausgeklappter Detail-Card | 1440x900 | SHOWCASE.md, features/innovation-radar.md |
| `admin-overview.png` | `/admin/ai-config` mit Provider-Cards und Fallback-Chain-Darstellung | 1440x900 | SHOWCASE.md, features/admin.md |
