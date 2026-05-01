# Feature-Liste & Testanleitung -- AI Hub

> Umfassende Liste aller Features mit Testanweisungen fuer manuelles Testen.

**Version:** 0.1.0 | **Stand:** 2026-02-21

---

## Inhaltsverzeichnis

- [1. Authentication](#1-authentication)
- [2. Dashboard](#2-dashboard)
- [3. Community Forum](#3-community-forum)
- [4. Idea Board](#4-idea-board)
- [5. Learn-Hub](#5-learn-hub)
- [6. Lernpfade](#6-lernpfade)
- [7. AI Features](#7-ai-features)
- [8. Living Cloud / AI Orb](#8-living-cloud--ai-orb)
- [9. Innovation Radar](#9-innovation-radar)
- [10. Gamification](#10-gamification)
- [11. Leaderboard](#11-leaderboard)
- [12. Profil](#12-profil)
- [13. Admin-Panel](#13-admin-panel)
- [14. Sicherheit](#14-sicherheit)
- [15. Performance](#15-performance)

---

## 1. Authentication

### 1.1 Login

| Feld | Wert |
|------|------|
| **Beschreibung** | Anmeldung mit E-Mail und Passwort ueber Supabase Auth |
| **Route** | `/login` |
| **Testschritte** | 1. Seite `/login` aufrufen<br>2. E-Mail und Passwort eingeben<br>3. "Anmelden" klicken |
| **Erwartetes Ergebnis** | Weiterleitung zum Dashboard (`/dashboard`). Bei falschen Daten erscheint eine Fehlermeldung. Loading-State waehrend der Authentifizierung sichtbar. |

### 1.2 Registrierung

| Feld | Wert |
|------|------|
| **Beschreibung** | Neuen Account erstellen mit Name, E-Mail und Passwort |
| **Route** | `/register` |
| **Testschritte** | 1. Seite `/register` aufrufen<br>2. Vollstaendigen Namen, E-Mail und Passwort eingeben<br>3. "Registrieren" klicken |
| **Erwartetes Ergebnis** | Account wird erstellt, Profil automatisch via DB-Trigger angelegt. Weiterleitung zum Dashboard. E-Mail-Bestaetigung ist fuer Development deaktiviert. |

### 1.3 Passwort vergessen

| Feld | Wert |
|------|------|
| **Beschreibung** | Passwort-Reset per E-Mail anfordern |
| **Route** | `/forgot-password` |
| **Testschritte** | 1. Seite `/forgot-password` aufrufen<br>2. E-Mail-Adresse eingeben<br>3. "Zuruecksetzen" klicken |
| **Erwartetes Ergebnis** | Bestaetigung, dass eine E-Mail gesendet wurde (sofern die E-Mail existiert). |

### 1.4 Logout

| Feld | Wert |
|------|------|
| **Beschreibung** | Abmeldung und Weiterleitung zur Login-Seite |
| **Route** | Verfuegbar ueber Header/Sidebar |
| **Testschritte** | 1. Im eingeloggten Zustand den Logout-Button klicken |
| **Erwartetes Ergebnis** | Session wird beendet, Weiterleitung zu `/login`. Geschuetzte Routen sind nicht mehr erreichbar. |

### 1.5 Auth-Middleware (Schutz)

| Feld | Wert |
|------|------|
| **Beschreibung** | Nicht-authentifizierte Nutzer werden automatisch umgeleitet |
| **Route** | Alle `/dashboard/*` Routen |
| **Testschritte** | 1. Im ausgeloggten Zustand direkt `/dashboard` aufrufen |
| **Erwartetes Ergebnis** | Automatische Weiterleitung zu `/login`. |

---

## 2. Dashboard

### 2.1 Stats-Grid (XP, Level, Streak)

| Feld | Wert |
|------|------|
| **Beschreibung** | Anzeige der wichtigsten Nutzer-Statistiken: XP-Punkte, aktueller Level, Streak-Tage |
| **Route** | `/dashboard` |
| **Testschritte** | 1. Dashboard aufrufen<br>2. Stats-Grid im oberen Bereich pruefen |
| **Erwartetes Ergebnis** | XP-Fortschrittsbalken, Level-Anzeige (1-7), Streak-Counter werden dargestellt. |

### 2.2 XP-Fortschrittsbalken

| Feld | Wert |
|------|------|
| **Beschreibung** | Visueller Balken der den Fortschritt zum naechsten Level zeigt |
| **Route** | `/dashboard` |
| **Testschritte** | 1. XP-Progress Widget auf dem Dashboard pruefen |
| **Erwartetes Ergebnis** | Balken zeigt aktuellen XP-Stand, naechstes Level und fehlende XP an. Level-Titel wird angezeigt (z.B. "Neugieriger", "KI-Entdecker"). |

### 2.3 Streak-Widget

| Feld | Wert |
|------|------|
| **Beschreibung** | Flammen-Animation mit Streak-Tagen und Tier-System |
| **Route** | `/dashboard` |
| **Testschritte** | 1. Streak-Widget auf dem Dashboard pruefen |
| **Erwartetes Ergebnis** | Aktuelle Streak-Tage, Flammen-Icon mit Tier-Farbe, laengste Streak-Anzeige. |

### 2.4 Personalisierte Empfehlungen

| Feld | Wert |
|------|------|
| **Beschreibung** | KI-generierte Vorschlaege aus 5 Datenquellen (Kurse, Best Practices, Posts, Challenges, Ideen) |
| **Route** | `/dashboard` |
| **Testschritte** | 1. Recommendation-Section auf dem Dashboard pruefen<br>2. Auf eine Empfehlung klicken |
| **Erwartetes Ergebnis** | Mehrere Empfehlungskarten mit Typ-Icon, Titel, Beschreibung. Klick fuehrt zur jeweiligen Detail-Seite. |

### 2.5 Letzte Achievements

| Feld | Wert |
|------|------|
| **Beschreibung** | Die zuletzt freigeschalteten Achievements des Nutzers |
| **Route** | `/dashboard` |
| **Testschritte** | 1. Recent-Achievements Section auf dem Dashboard pruefen |
| **Erwartetes Ergebnis** | Achievement-Cards mit Icon, Name, Beschreibung und Freischaltdatum. |

### 2.6 Aktivitaets-Feed

| Feld | Wert |
|------|------|
| **Beschreibung** | Chronologischer Feed der neuesten Community-Aktivitaeten |
| **Route** | `/dashboard` |
| **Testschritte** | 1. Activity Feed auf dem Dashboard nach unten scrollen |
| **Erwartetes Ergebnis** | Liste der letzten Aktivitaeten (Posts, Kommentare, Achievements). |

---

## 3. Community Forum

### 3.1 Posts auflisten

| Feld | Wert |
|------|------|
| **Beschreibung** | Alle Community-Posts mit Filtern und Sortierung |
| **Route** | `/community` |
| **Testschritte** | 1. Community-Seite aufrufen<br>2. Verschiedene Sortierungen testen (Neueste, Beliebteste)<br>3. Filter nach Typ und Tags testen |
| **Erwartetes Ergebnis** | Post-Liste wird angezeigt mit Titel, Autor, Votes, Kommentar-Anzahl, Tags. Pagination funktioniert. |

### 3.2 Post erstellen

| Feld | Wert |
|------|------|
| **Beschreibung** | Neuen Community-Post verfassen |
| **Route** | `/community` (Create-Button) |
| **Testschritte** | 1. "Neuer Beitrag" Button klicken<br>2. Titel, Inhalt und Tags eingeben<br>3. Absenden |
| **Erwartetes Ergebnis** | Post wird erstellt, erscheint in der Liste. Autor erhaelt 15 XP. |

### 3.3 Post-Detail anzeigen

| Feld | Wert |
|------|------|
| **Beschreibung** | Einzelnen Post mit allen Kommentaren anzeigen |
| **Route** | `/community/[postId]` |
| **Testschritte** | 1. Auf einen Post in der Liste klicken |
| **Erwartetes Ergebnis** | Post-Inhalt, Autor, Erstelldatum, Tags, Vote-Count und Thread-Ansicht der Kommentare. |

### 3.4 Kommentar schreiben

| Feld | Wert |
|------|------|
| **Beschreibung** | Kommentar zu einem Post hinzufuegen (bis 4 Verschachtelungs-Ebenen) |
| **Route** | `/community/[postId]` |
| **Testschritte** | 1. Post-Detail aufrufen<br>2. Kommentar-Feld ausfuellen<br>3. Absenden<br>4. Auf "Antworten" bei einem Kommentar klicken fuer verschachtelte Antwort |
| **Erwartetes Ergebnis** | Kommentar erscheint in der Thread-Ansicht. Verschachtelung bis 4 Ebenen. Autor erhaelt 5 XP. |

### 3.5 Upvote/Downvote (Toggle)

| Feld | Wert |
|------|------|
| **Beschreibung** | Toggle-Upvote auf Posts (ein Klick = Vote, zweiter Klick = Vote entfernen) |
| **Route** | `/community` oder `/community/[postId]` |
| **Testschritte** | 1. Upvote-Button bei einem Post klicken<br>2. Erneut klicken zum Entfernen |
| **Erwartetes Ergebnis** | Vote-Count aendert sich. Kein Self-Vote-XP (DB-Constraint). Eigener Vote wird visuell hervorgehoben. |

### 3.6 Badges

| Feld | Wert |
|------|------|
| **Beschreibung** | 12 Community-Badges (first-post, commentator, influencer, etc.) |
| **Route** | Sichtbar in Post-Detail und Profil |
| **Testschritte** | 1. Badge-Icons neben Nutzernamen pruefen<br>2. Profil-Seite aufrufen fuer vollstaendige Badge-Liste |
| **Erwartetes Ergebnis** | Verdiente Badges werden neben dem Nutzernamen angezeigt. |

---

## 4. Idea Board

### 4.1 Ideen-Uebersicht

| Feld | Wert |
|------|------|
| **Beschreibung** | Grid-Layout aller eingereichten KI-Ideen mit Gold-Akzent-Cards |
| **Route** | `/community/ideas` |
| **Testschritte** | 1. Idea Board aufrufen<br>2. Ideen-Grid pruefen |
| **Erwartetes Ergebnis** | Ideen werden als Cards mit Titel, Beschreibung, Vote-Count und Autor angezeigt. Gold-Akzent im Design sichtbar. |

### 4.2 Idee erstellen

| Feld | Wert |
|------|------|
| **Beschreibung** | Neue KI-Idee einreichen |
| **Route** | `/community/ideas` (Create-Button) |
| **Testschritte** | 1. "Neue Idee" Button klicken<br>2. Titel und Beschreibung eingeben<br>3. Absenden |
| **Erwartetes Ergebnis** | Idee erscheint im Grid. Autor erhaelt XP. |

### 4.3 Ideen filtern und sortieren

| Feld | Wert |
|------|------|
| **Beschreibung** | Sortierung und Filterung der Ideen |
| **Route** | `/community/ideas` |
| **Testschritte** | 1. Sortierungs-Dropdown aendern (Neueste, Beliebteste, Hoechster Score)<br>2. Filter-Optionen testen |
| **Erwartetes Ergebnis** | Ideen werden entsprechend sortiert. Filter schraenkt Ergebnisse korrekt ein. |

### 4.4 Idee voten

| Feld | Wert |
|------|------|
| **Beschreibung** | Fuer eine Idee abstimmen |
| **Route** | `/community/ideas` |
| **Testschritte** | 1. Vote-Button bei einer Idee klicken |
| **Erwartetes Ergebnis** | Vote-Count erhoet sich. Button-State aendert sich visuell. |

---

## 5. Learn-Hub

### 5.1 Kurs-Uebersicht

| Feld | Wert |
|------|------|
| **Beschreibung** | Grid aller verfuegbaren Kurse mit Filter und Fortschrittsbalken |
| **Route** | `/learn-hub` |
| **Testschritte** | 1. Learn-Hub aufrufen<br>2. Kurse pruefen (3 Seed-Kurse vorhanden)<br>3. Filter nach Schwierigkeitsgrad testen |
| **Erwartetes Ergebnis** | Kurs-Cards mit Titel, Beschreibung, Schwierigkeitsgrad, Lektionsanzahl und Fortschrittsbalken. |

### 5.2 Kurs-Detail

| Feld | Wert |
|------|------|
| **Beschreibung** | Einzelner Kurs mit Lektionsliste und Sidebar |
| **Route** | `/learn-hub/[courseId]` |
| **Testschritte** | 1. Auf einen Kurs klicken<br>2. Lektionsliste in der Sidebar pruefen |
| **Erwartetes Ergebnis** | Kurs-Beschreibung, Lektionsliste mit Abschluss-Status, Fortschrittsanzeige. |

### 5.3 Lektion absolvieren

| Feld | Wert |
|------|------|
| **Beschreibung** | Lektion lesen und als abgeschlossen markieren |
| **Route** | `/learn-hub/[courseId]/[lessonId]` |
| **Testschritte** | 1. Lektion aufrufen<br>2. Inhalt lesen (Markdown-Rendering)<br>3. "Lektion abschliessen" klicken |
| **Erwartetes Ergebnis** | Inhalt wird als HTML gerendert (DOMPurify sanitized). XP-Animation nach Abschluss (25 XP). Keine doppelte XP-Vergabe bei erneutem Abschluss (3-fache Absicherung). |

### 5.4 Quiz absolvieren

| Feld | Wert |
|------|------|
| **Beschreibung** | Multiple-Choice Quiz nach Lektionen |
| **Route** | Innerhalb der Lektion (Quiz-Component) |
| **Testschritte** | 1. Lektion mit Quiz aufrufen<br>2. Fragen beantworten<br>3. Quiz absenden |
| **Erwartetes Ergebnis** | Sofort-Feedback pro Frage (richtig/falsch). Bestanden bei >= 70%. Ergebnis-Zusammenfassung mit Score-Anzeige. |

### 5.5 Kurs-Abschluss & Zertifikat

| Feld | Wert |
|------|------|
| **Beschreibung** | Automatische Zertifikat-Generierung nach Abschluss aller Lektionen |
| **Route** | `/learn-hub/[courseId]` (nach letzter Lektion) |
| **Testschritte** | 1. Alle Lektionen eines Kurses abschliessen<br>2. Kurs-Abschluss-Seite pruefen |
| **Erwartetes Ergebnis** | Zertifikat wird generiert und angezeigt. XP-Belohnung fuer Kurs-Abschluss. |

---

## 6. Lernpfade

### 6.1 Lernpfade-Uebersicht

| Feld | Wert |
|------|------|
| **Beschreibung** | Kuratierte Kurs-Reihenfolgen als Lernpfade (3 Seed-Pfade) |
| **Route** | `/learn-hub/paths` |
| **Testschritte** | 1. Lernpfade-Seite aufrufen<br>2. Verfuegbare Pfade pruefen |
| **Erwartetes Ergebnis** | Lernpfad-Cards mit Titel, Beschreibung, Kurs-Anzahl, geschaetzte Dauer. |

### 6.2 Lernpfad-Detail mit Stepper

| Feld | Wert |
|------|------|
| **Beschreibung** | Detail-Ansicht mit Timeline/Stepper der Kurs-Reihenfolge |
| **Route** | `/learn-hub/paths/[pathId]` |
| **Testschritte** | 1. Auf einen Lernpfad klicken<br>2. Stepper-UI mit Kurs-Reihenfolge pruefen |
| **Erwartetes Ergebnis** | Timeline zeigt Kurse in korrekter Reihenfolge. Aktueller Fortschritt wird hervorgehoben. Abgeschlossene Kurse sind markiert. |

### 6.3 Lernpfad-Enrollment

| Feld | Wert |
|------|------|
| **Beschreibung** | Sich fuer einen Lernpfad einschreiben |
| **Route** | `/learn-hub/paths/[pathId]` |
| **Testschritte** | 1. Lernpfad-Detail aufrufen<br>2. "Einschreiben" Button klicken |
| **Erwartetes Ergebnis** | Nutzer wird fuer den Pfad eingeschrieben. Fortschrittsanzeige wird aktiviert. Button aendert sich zu "Eingeschrieben". |

### 6.4 Lernpfad-Fortschritt

| Feld | Wert |
|------|------|
| **Beschreibung** | Progress-Bar zeigt Gesamtfortschritt im Lernpfad |
| **Route** | `/learn-hub/paths/[pathId]` |
| **Testschritte** | 1. Eingeschriebenen Lernpfad aufrufen<br>2. Einen Kurs im Pfad absolvieren<br>3. Fortschritt pruefen |
| **Erwartetes Ergebnis** | Progress-Bar aktualisiert sich nach Kurs-Abschluss. Naechster Kurs wird hervorgehoben. |

---

## 7. AI Features

### 7.1 AI Mentor Chat

| Feld | Wert |
|------|------|
| **Beschreibung** | Multi-Provider KI-Chat mit Streaming-Responses |
| **Route** | `/ai-mentor` |
| **Testschritte** | 1. AI Mentor Seite aufrufen<br>2. Nachricht eingeben<br>3. Response abwarten |
| **Erwartetes Ergebnis** | Streaming-Response von KI (Standard: Gemini). Chat-Verlauf scrollbar. Kontext-Banner zeigt aktuelle Seite. Content Moderation aktiv. |

### 7.2 AI Mentor Chat (via Living Cloud)

| Feld | Wert |
|------|------|
| **Beschreibung** | Chat ueber die Living Cloud oeffnen (von jeder Seite aus) |
| **Route** | Beliebige Seite (Living Cloud rechts unten) |
| **Testschritte** | 1. Living Cloud (Orb) anklicken<br>2. Chat-Panel oeffnet sich<br>3. Nachricht senden<br>4. Minimize-Button klicken |
| **Erwartetes Ergebnis** | Chat-Panel expandiert fliessend. Chat-Verlauf bleibt erhalten. Minimize schrumpft zurueck zur Cloud. |

### 7.3 Semantic Search

| Feld | Wert |
|------|------|
| **Beschreibung** | Vektorbasierte Suche ueber alle Inhalte mittels pgvector |
| **Route** | `/api/search` (ueber Suchfeld) |
| **Testschritte** | 1. Suchfeld verwenden<br>2. Einen semantisch verwandten Begriff eingeben (nicht exakter Wortlaut) |
| **Erwartetes Ergebnis** | Semantisch relevante Ergebnisse werden angezeigt, auch wenn der exakte Suchbegriff nicht im Text vorkommt. Rate Limiting aktiv. |

### 7.4 Auto-Tagging

| Feld | Wert |
|------|------|
| **Beschreibung** | Automatische Verschlagwortung von Inhalten durch KI |
| **Route** | `/api/ai/auto-tag` (automatisch bei Content-Erstellung) |
| **Testschritte** | 1. Neuen Best Practice oder Post erstellen<br>2. Tags pruefen |
| **Erwartetes Ergebnis** | Relevante Tags werden automatisch vorgeschlagen bzw. zugewiesen. Rate Limiting aktiv. |

### 7.5 Use-Case-Bewertung

| Feld | Wert |
|------|------|
| **Beschreibung** | KI-gestuetzte Bewertung von Ideen anhand 5 Dimensionen |
| **Route** | `/api/ai/evaluate` (ueber Idea Board oder Evaluation Page) |
| **Testschritte** | 1. Eine Idee auf dem Idea Board einreichen<br>2. "KI-Bewertung anfordern"<br>3. Ergebnis pruefen |
| **Erwartetes Ergebnis** | Bewertung mit Gesamtscore (0-100), Einzelscores pro Dimension, Staerken-Analyse, Risiken, ROI-Schaetzung und Empfehlung (Sofort umsetzen / Pilotprojekt / Weiterentwickeln / Zurueckstellen). |

---

## 8. Living Cloud / AI Orb

> **Das Alleinstellungsmerkmal der Plattform -- gruendlich testen!**

### 8.1 Grundlegende Sichtbarkeit

| Feld | Wert |
|------|------|
| **Beschreibung** | Living Cloud ist auf jeder Seite sichtbar (position: fixed, rechts unten) |
| **Route** | Alle Dashboard-Seiten |
| **Testschritte** | 1. Verschiedene Seiten aufrufen (Dashboard, Community, Learn-Hub, etc.)<br>2. Pruefen ob der Orb rechts unten sichtbar ist |
| **Erwartetes Ergebnis** | 64px runder Orb mit Gruen-Gold-Gradient, immer sichtbar, z-index: 9999. Breathing-Animation laeuft. |

### 8.2 Idle State

| Feld | Wert |
|------|------|
| **Beschreibung** | Standard-Zustand mit sanftem Pulsieren |
| **Route** | Beliebige Seite |
| **Testschritte** | 1. Orb beobachten ohne Interaktion |
| **Erwartetes Ergebnis** | Sanftes Gruen-Gold Pulsieren (Breathing-Animation, 3s-Zyklus). Rotierender Ring mit Gold-Partikel (8s-Zyklus). Status-Dot (gruen) sichtbar. |

### 8.3 Hover State

| Feld | Wert |
|------|------|
| **Beschreibung** | Vergroesserung und Tooltip bei Mouse-Over |
| **Route** | Beliebige Seite |
| **Testschritte** | 1. Maus ueber den Orb bewegen |
| **Erwartetes Ergebnis** | Orb wird groesser (scale 1.1). Tooltip erscheint als Pill-Shape ueber dem Orb mit kontextabhaengigem Text. Pfeil nach unten zur Cloud. |

### 8.4 Greeting State

| Feld | Wert |
|------|------|
| **Beschreibung** | Willkommens-Animation beim ersten Laden |
| **Route** | `/dashboard` (beim Login) |
| **Testschritte** | 1. Einloggen und Dashboard aufrufen |
| **Erwartetes Ergebnis** | Orb zeigt Gold-dominanten Glow mit Greeting-Animation. Tooltip: "Willkommen zurueck!". Auto-Reset nach 3 Sekunden zurueck zu idle. |

### 8.5 Listening State

| Feld | Wert |
|------|------|
| **Beschreibung** | Aktives Zuhoeren auf der AI Mentor Seite |
| **Route** | `/ai-mentor` |
| **Testschritte** | 1. AI Mentor Seite aufrufen |
| **Erwartetes Ergebnis** | Orb wechselt zu Gruen-Gradient. Ring-Rotation beschleunigt sich. Tooltip: "Ich hoere zu...". |

### 8.6 Thinking State

| Feld | Wert |
|------|------|
| **Beschreibung** | KI verarbeitet gerade eine Anfrage |
| **Route** | `/ai-mentor` (nach Nachricht senden) |
| **Testschritte** | 1. Im AI Mentor eine Nachricht senden<br>2. Orb waehrend der Verarbeitung beobachten |
| **Erwartetes Ergebnis** | Orb wechselt zu Gold-Gradient. Ring pausiert. Pulsieren beschleunigt sich. Tooltip: "Die KI denkt nach...". |

### 8.7 Celebration State

| Feld | Wert |
|------|------|
| **Beschreibung** | Feier-Animation bei Achievements |
| **Route** | Beliebige Seite (nach Achievement) |
| **Testschritte** | 1. Ein Achievement ausloesen (z.B. Kurslektion abschliessen)<br>2. Orb-Reaktion beobachten |
| **Erwartetes Ergebnis** | Gold-Partikel orbiten den Orb (OrbParticles Component). Gold-Glow-Animation. Tooltip: "Gratulation!". Auto-Reset nach 3 Sekunden. |

### 8.8 Energized State

| Feld | Wert |
|------|------|
| **Beschreibung** | Energetischer Zustand (z.B. auf dem Leaderboard) |
| **Route** | Kontextabhaengig |
| **Testschritte** | 1. Leaderboard aufrufen oder Streak-Meilenstein erreichen |
| **Erwartetes Ergebnis** | Gruen-Gold Schnell-Animation. Energetischer Glow. Tooltip: "Du bist auf Feuer!". |

### 8.9 Click: Chat-Panel oeffnen

| Feld | Wert |
|------|------|
| **Beschreibung** | Per Klick expandiert die Cloud zum Chat-Panel |
| **Route** | Beliebige Seite |
| **Testschritte** | 1. Orb anklicken<br>2. Chat-Panel wird angezeigt<br>3. Nachricht senden<br>4. Minimize klicken |
| **Erwartetes Ergebnis** | Orb verschwindet (exit Animation). Chat-Panel erscheint (Framer Motion AnimatePresence). Panel: 400px breit, fixed rechts. Header mit Cloud-Animation, Chat-Bereich, Input-Feld. Minimize schrumpft zurueck. |

### 8.10 Accessibility

| Feld | Wert |
|------|------|
| **Beschreibung** | Screen Reader und Reduced Motion Support |
| **Route** | Beliebige Seite |
| **Testschritte** | 1. `prefers-reduced-motion` im Browser aktivieren<br>2. Screen Reader testen<br>3. Tab-Navigation zum Orb testen |
| **Erwartetes Ergebnis** | Animationen werden reduziert/deaktiviert bei `prefers-reduced-motion`. `aria-live` Region kuendigt State-Aenderungen an. `aria-label="AI Mentor oeffnen"` vorhanden. Focus-Ring bei Tastatur-Navigation (focus-visible). |

---

## 9. Innovation Radar

### 9.1 Radar-Visualisierung

| Feld | Wert |
|------|------|
| **Beschreibung** | SVG-basierte Radar-Darstellung mit 4 konzentrischen Ringen und 4 Quadranten |
| **Route** | `/innovation-radar` |
| **Testschritte** | 1. Innovation Radar aufrufen<br>2. SVG-Radar pruefen |
| **Erwartetes Ergebnis** | 4 Ringe (Adopt, Trial, Assess, Hold) sichtbar. 4 Quadranten (Techniques, Tools, Platforms, Frameworks). Themen als Punkte auf dem Radar positioniert. Dynamic Import fuer Performance. |

### 9.2 Topic-Sidebar

| Feld | Wert |
|------|------|
| **Beschreibung** | Seitenleiste mit Themen-Liste, Suche und Filtern |
| **Route** | `/innovation-radar` |
| **Testschritte** | 1. Sidebar pruefen<br>2. Suchfeld verwenden<br>3. Filter nach Quadrant testen |
| **Erwartetes Ergebnis** | Themen-Liste mit Icons und Ring-Zuordnung. Suche filtert Ergebnisse in Echtzeit. Quadrant-Filter funktioniert. |

### 9.3 Topic-Detail-Card

| Feld | Wert |
|------|------|
| **Beschreibung** | Detailansicht eines KI-Themas mit Ring-Erklaerung |
| **Route** | `/innovation-radar` (nach Klick auf Topic) |
| **Testschritte** | 1. Auf ein Thema im Radar oder in der Sidebar klicken |
| **Erwartetes Ergebnis** | Detail-Card mit Titel, Beschreibung, Ring-Erklaerung (warum in diesem Ring), Trend-Richtung. |

### 9.4 Trending Topics

| Feld | Wert |
|------|------|
| **Beschreibung** | Top 5 der aktuell meistdiskutierten KI-Themen |
| **Route** | `/innovation-radar` |
| **Testschritte** | 1. Trending Topics Section pruefen |
| **Erwartetes Ergebnis** | Die 5 beliebtesten Themen mit Trend-Indikator. |

---

## 10. Gamification

### 10.1 XP-Vergabe

| Feld | Wert |
|------|------|
| **Beschreibung** | XP werden fuer verschiedene Aktionen vergeben |
| **Route** | Systemweit |
| **Testschritte** | 1. Kurslektion abschliessen (25 XP)<br>2. Community-Beitrag erstellen (15 XP)<br>3. Kommentar schreiben (5 XP)<br>4. XP-Stand auf dem Dashboard pruefen |
| **Erwartetes Ergebnis** | XP werden korrekt addiert. Fortschrittsbalken aktualisiert sich. XP-Animation wird angezeigt. |

### 10.2 Level-System (7 Levels)

| Feld | Wert |
|------|------|
| **Beschreibung** | 7 Levels: Neugieriger (0) bis KI-Visionaer (10.000 XP) |
| **Route** | `/dashboard`, `/profile` |
| **Testschritte** | 1. Aktuellen Level auf Dashboard pruefen<br>2. XP sammeln bis zum naechsten Level |
| **Erwartetes Ergebnis** | Level-Titel und -Icon werden angezeigt. Level-Up wird visuell kommuniziert. |

### 10.3 Achievements (20 Stueck, 4 Kategorien)

| Feld | Wert |
|------|------|
| **Beschreibung** | 20 Achievements in 4 Kategorien: Learning, Community, Innovation, Engagement |
| **Route** | `/profile/achievements` |
| **Testschritte** | 1. Achievements-Seite aufrufen<br>2. Kategorie-Tabs wechseln<br>3. Freigeschaltete und gesperrte Achievements pruefen |
| **Erwartetes Ergebnis** | Achievements-Grid mit Kategorie-Tabs. Freigeschaltete Achievements farbig, gesperrte ausgegraut. Progress-Anzeige bei teilweise freigeschalteten Achievements. |

### 10.4 Streaks

| Feld | Wert |
|------|------|
| **Beschreibung** | Taegliche Login-Streaks mit Tier-System und Flammen-Animation |
| **Route** | `/dashboard` (Streak-Widget) |
| **Testschritte** | 1. Taeglich einloggen<br>2. Streak-Counter pruefen<br>3. Streak-Tier (Farbe) beobachten |
| **Erwartetes Ergebnis** | Streak-Counter zaehlt hoch. Flammen-Icon aendert Farbe je nach Tier. Laengste Streak wird gespeichert. |

### 10.5 Challenges

| Feld | Wert |
|------|------|
| **Beschreibung** | Zeitbasierte Herausforderungen mit Belohnungen |
| **Route** | `/challenges` |
| **Testschritte** | 1. Challenges-Seite aufrufen<br>2. Aktive Challenges pruefen<br>3. An einer Challenge teilnehmen ("Beitreten" klicken) |
| **Erwartetes Ergebnis** | Challenge-Liste mit Titel, Beschreibung, Zeitraum, Belohnung. Status-Filter (aktiv, abgeschlossen). |

### 10.6 Challenge-Detail

| Feld | Wert |
|------|------|
| **Beschreibung** | Detailansicht einer Challenge mit Fortschritt und Teilnehmern |
| **Route** | `/challenges/[challengeId]` |
| **Testschritte** | 1. Auf eine Challenge klicken<br>2. Detail-Seite pruefen<br>3. "Beitreten" klicken<br>4. Fortschritt melden |
| **Erwartetes Ergebnis** | Challenge-Details, Teilnehmer-Liste, Fortschritts-Tracking, XP-Vergabe bei Abschluss (100 XP). |

---

## 11. Leaderboard

### 11.1 Rangliste anzeigen

| Feld | Wert |
|------|------|
| **Beschreibung** | Rangliste der aktivsten Nutzer |
| **Route** | `/leaderboard` |
| **Testschritte** | 1. Leaderboard aufrufen<br>2. Liste pruefen |
| **Erwartetes Ergebnis** | Sortierte Rangliste mit Platz, Name, XP, Level, Badges. Top 3 als Podest dargestellt. |

### 11.2 Perioden-Filter

| Feld | Wert |
|------|------|
| **Beschreibung** | Rangliste nach Zeitraum filtern (Woche, Monat, Gesamt) |
| **Route** | `/leaderboard` |
| **Testschritte** | 1. Zwischen Woche/Monat/Gesamt wechseln |
| **Erwartetes Ergebnis** | Rangliste aktualisiert sich. Daten stammen aus echten Supabase-Abfragen. |

### 11.3 Eigenes Ranking

| Feld | Wert |
|------|------|
| **Beschreibung** | Eigener Platz wird hervorgehoben |
| **Route** | `/leaderboard` |
| **Testschritte** | 1. Leaderboard aufrufen<br>2. Eigenen Eintrag suchen |
| **Erwartetes Ergebnis** | Eigener Platz ist farblich hervorgehoben. Position und XP-Abstand zum naechsten Platz sichtbar. |

---

## 12. Profil

### 12.1 Profil-Anzeige

| Feld | Wert |
|------|------|
| **Beschreibung** | Eigenes Profil mit Stats, Badges und Aktivitaet |
| **Route** | `/profile` |
| **Testschritte** | 1. Profil-Seite aufrufen |
| **Erwartetes Ergebnis** | Name, E-Mail, Level, XP, Badges, Stats (Posts, Kommentare, Kurse). Daten aus Supabase (nicht Demo-Daten). |

### 12.2 Profil-Settings

| Feld | Wert |
|------|------|
| **Beschreibung** | Profilname und Einstellungen bearbeiten |
| **Route** | `/profile/settings` |
| **Testschritte** | 1. Settings-Seite aufrufen<br>2. Namen aendern<br>3. Speichern |
| **Erwartetes Ergebnis** | Formular mit aktuellen Daten vorbefuellt. Aenderungen werden in Supabase gespeichert. Erfolgs-Meldung nach dem Speichern. |

### 12.3 Achievements-Seite

| Feld | Wert |
|------|------|
| **Beschreibung** | Alle 20 Achievements mit Kategorien und Fortschritt |
| **Route** | `/profile/achievements` |
| **Testschritte** | 1. Achievements-Seite aufrufen<br>2. Kategorie-Tabs wechseln (Learning, Community, Innovation, Engagement) |
| **Erwartetes Ergebnis** | Grid mit allen 20 Achievements. Freigeschaltete sind hervorgehoben. Kategorie-Tabs filtern korrekt. Progress-Anzeige bei Achievements mit Fortschritt. |

---

## 13. Admin-Panel

> **Hinweis:** Nur mit Admin-Rolle erreichbar. Alle API-Aufrufe verwenden `requireAdmin()`.

### 13.1 Admin-Dashboard

| Feld | Wert |
|------|------|
| **Beschreibung** | Uebersichts-Seite des Admin-Panels mit Tabs fuer Module |
| **Route** | `/admin` |
| **Testschritte** | 1. Als Admin einloggen<br>2. `/admin` aufrufen |
| **Erwartetes Ergebnis** | Admin-Dashboard mit Tabs/Navigationsleiste fuer alle 6 Module. Nicht-Admin-User erhalten keinen Zugang. |

### 13.2 KI-Konfiguration

| Feld | Wert |
|------|------|
| **Beschreibung** | Provider-Management, Fallback-Chain, Parameter, System-Prompts |
| **Route** | `/admin/ai-config` |
| **Testschritte** | 1. AI Config aufrufen<br>2. Provider-Cards pruefen (Gemini, Claude, OpenAI, Copilot)<br>3. Fallback-Chain-Visualisierung pruefen<br>4. System-Prompts einsehen |
| **Erwartetes Ergebnis** | Provider-Cards mit Status (aktiv/inaktiv), Modell, Temperature, Max-Tokens. Fallback-Chain als visuelle Kette. System-Prompts mit Versionen. |

### 13.3 Provider-Sandbox (Test)

| Feld | Wert |
|------|------|
| **Beschreibung** | Gleiche Anfrage an alle Provider senden und vergleichen |
| **Route** | `/admin/ai-config` (Sandbox-Tab) |
| **Testschritte** | 1. Test-Prompt eingeben<br>2. Provider auswaehlen<br>3. "Testen" klicken |
| **Erwartetes Ergebnis** | Response vom gewaehlten Provider. Antwort-Qualitaet und Latenz sichtbar. |

### 13.4 Benutzer-Verwaltung

| Feld | Wert |
|------|------|
| **Beschreibung** | Benutzerliste mit Rollen, XP, Status |
| **Route** | `/admin/users` |
| **Testschritte** | 1. Users-Seite aufrufen<br>2. Benutzer suchen<br>3. Rolle aendern |
| **Erwartetes Ergebnis** | Benutzerliste mit Name, E-Mail, Rolle, XP, Level, Status. Such- und Filterfunktion. |

### 13.5 Content-Management

| Feld | Wert |
|------|------|
| **Beschreibung** | Best Practices und Kurse moderieren und verwalten |
| **Route** | `/admin/content` |
| **Testschritte** | 1. Content-Seite aufrufen<br>2. Inhalte pruefen |
| **Erwartetes Ergebnis** | Liste aller Inhalte mit Status (veroeffentlicht/Entwurf/gesperrt). Moderations-Aktionen. |

### 13.6 Analytics Dashboard

| Feld | Wert |
|------|------|
| **Beschreibung** | Nutzungsstatistiken und KI-Metriken |
| **Route** | `/admin/analytics` |
| **Testschritte** | 1. Analytics-Seite aufrufen |
| **Erwartetes Ergebnis** | Kennzahlen: aktive Nutzer, Content-Statistiken, KI-Nutzung. |

### 13.7 Kosten-Dashboard

| Feld | Wert |
|------|------|
| **Beschreibung** | API-Kosten pro Provider, Feature und Zeitraum |
| **Route** | `/admin/ai-config` (Kosten-Tab) |
| **Testschritte** | 1. Kosten-Dashboard aufrufen<br>2. Zeitraum wechseln |
| **Erwartetes Ergebnis** | Kosten-Aufstellung nach Provider, Tokens (Input/Output), Features. Zeitraum-Filter (Tag/Woche/Monat). |

### 13.8 System-Einstellungen

| Feld | Wert |
|------|------|
| **Beschreibung** | Feature Flags, Wartungsmodus und allgemeine Einstellungen |
| **Route** | `/admin/settings` |
| **Testschritte** | 1. Settings-Seite aufrufen<br>2. Feature Flags pruefen |
| **Erwartetes Ergebnis** | Feature-Flag-Toggles fuer alle Features. Wartungsmodus-Schalter. |

---

## 14. Sicherheit

### 14.1 Rate Limiting (Upstash Redis)

| Feld | Wert |
|------|------|
| **Beschreibung** | 4 Tiers: AI (streng), Search (mittel), Write, Read. Schuetzt AI- und Search-Routen. |
| **Route** | `/api/ai/*`, `/api/search` |
| **Testschritte** | 1. Viele AI-Anfragen in kurzer Zeit senden<br>2. Auf Rate-Limit-Response achten |
| **Erwartetes Ergebnis** | Nach Ueberschreitung des Limits: HTTP 429 Response mit Retry-After Header. Graceful Degradation (keine Fehlerseite). |

### 14.2 XSS-Schutz (DOMPurify)

| Feld | Wert |
|------|------|
| **Beschreibung** | Alle `dangerouslySetInnerHTML`-Stellen sind mit DOMPurify sanitized |
| **Route** | `/best-practices/[id]`, `/learn-hub/[courseId]/[lessonId]` |
| **Testschritte** | 1. Content mit potenziellem XSS erstellen (z.B. `<script>alert('xss')</script>` im Inhalt)<br>2. Content-Seite aufrufen |
| **Erwartetes Ergebnis** | Kein Script wird ausgefuehrt. HTML wird bereinigt dargestellt. Script-Tags werden entfernt. |

### 14.3 Auth auf API-Endpoints

| Feld | Wert |
|------|------|
| **Beschreibung** | Alle API-Endpoints verwenden `requireAuth()` oder `requireAdmin()` |
| **Route** | Alle `/api/*` Routen |
| **Testschritte** | 1. API-Request ohne Auth-Cookie/Token senden (z.B. via curl) |
| **Erwartetes Ergebnis** | HTTP 401 Unauthorized Response. Keine Daten werden zurueckgegeben. |

### 14.4 Zod-Validierung

| Feld | Wert |
|------|------|
| **Beschreibung** | Schema-Validierung auf allen API-Inputs mit Zod |
| **Route** | Alle `/api/*` Routen |
| **Testschritte** | 1. API-Request mit ungueltigem Body senden (fehlende Pflichtfelder, falsche Typen) |
| **Erwartetes Ergebnis** | HTTP 400 Bad Request mit verstaendlicher Fehlermeldung (Zod Error Details). |

### 14.5 Row Level Security (RLS)

| Feld | Wert |
|------|------|
| **Beschreibung** | 50+ RLS Policies in Supabase fuer granulare Zugriffsrechte |
| **Route** | Datenbank-Ebene |
| **Testschritte** | 1. Als User A einloggen und Daten von User B abfragen<br>2. Admin-Daten als normaler User abrufen |
| **Erwartetes Ergebnis** | Nur eigene Daten sind sichtbar (sofern nicht oeffentlich). Admin-Daten sind nur fuer Admins einsehbar. |

---

## 15. Performance

### 15.1 Dynamic Imports

| Feld | Wert |
|------|------|
| **Beschreibung** | Schwere Komponenten werden per Dynamic Import lazy geladen |
| **Route** | Systemweit |
| **Testschritte** | 1. Network-Tab im Browser oeffnen<br>2. Innovation Radar aufrufen (RadarChart ist dynamisch)<br>3. Living Cloud anklicken (ChatPanel ist dynamisch) |
| **Erwartetes Ergebnis** | JS-Chunks werden erst bei Bedarf geladen (nicht im initialen Bundle). Kuerzere Ladezeiten. |

### 15.2 Server Components

| Feld | Wert |
|------|------|
| **Beschreibung** | 5 Admin/Notification-Seiten wurden zu Server Components migriert |
| **Route** | `/admin/*`, `/notifications` |
| **Testschritte** | 1. Admin-Seiten aufrufen<br>2. Quellcode auf fehlendes "use client" pruefen |
| **Erwartetes Ergebnis** | Seiten werden server-seitig gerendert. Kein "use client" Directive. Weniger Client-JS. |

### 15.3 Query-Optimierungen

| Feld | Wert |
|------|------|
| **Beschreibung** | N+1 Query Fix und Over-fetching Fix in API-Routen |
| **Route** | `/api/community/posts`, `/api/learn-hub/courses` |
| **Testschritte** | 1. Community-Posts laden<br>2. Kurse laden<br>3. Netzwerk-Anfragen im Browser pruefen |
| **Erwartetes Ergebnis** | Weniger DB-Anfragen als vorher. Posts laden explizite Felder (kein `select("*")`). Kurse verwenden parallele statt sequentielle Queries. |

### 15.4 Reduced Motion

| Feld | Wert |
|------|------|
| **Beschreibung** | Animationen werden bei `prefers-reduced-motion` deaktiviert |
| **Route** | Systemweit (insbesondere Living Cloud, CSS-Animationen) |
| **Testschritte** | 1. `prefers-reduced-motion: reduce` im Betriebssystem oder DevTools aktivieren<br>2. Living Cloud und andere Animationen pruefen |
| **Erwartetes Ergebnis** | Alle CSS-Animationen stoppen. Living Cloud zeigt nur statische Farben. Kein visuelles Flackern. |

---

## Legende

| Symbol | Bedeutung |
|--------|-----------|
| XP | Experience Points (Erfahrungspunkte) |
| RLS | Row Level Security (Zugriffskontrolle auf Datenbankebene) |
| DB | Datenbank (Supabase PostgreSQL) |
| API | Application Programming Interface (Backend-Schnittstelle) |
| E2E | End-to-End (vollstaendiger Browser-Test) |

---

> **Tipp:** Fuer automatisierte Tests existieren 91 Unit-Tests (`npm test`) und 14 E2E-Tests (`npm run test:e2e`).
