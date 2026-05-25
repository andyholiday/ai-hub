# Command Palette & Globale Suche

**Was es ist:** Eine globale Suchpalette (Cmd/Ctrl+K), die von jeder Seite aus erreichbar ist und sowohl Schnellnavigation als auch semantische Inhaltssuche ueber `/api/search/hybrid` kombiniert.

## Mehrwert / Benefit

Nutzer muessen nicht mehr durch die Sidebar navigieren — eine Tastenkombination genuegt, um sofort zu jeder Seite zu springen oder Inhalte (Best Practices) nach Bedeutung zu suchen, nicht nur nach exakten Woertern. Im Privacy-Mode laeuft die Suche vollstaendig im Browser.

## User-Prozess

1. Nutzer drueckt **Cmd+K** (Mac) oder **Ctrl+K** (Windows/Linux) auf einer beliebigen Dashboard-Seite.
2. Ein modales Suchdialog (via `cmdk`-Library) oeffnet sich.
3. Ohne Eingabe zeigt die Palette die zehn Schnellnavigations-Ziele (Dashboard, Community, Learn Hub, etc.).
4. Bei Eingabe (>= 1 Zeichen) startet nach 200ms Debounce eine Suche:
   - **Standard-Modus:** POST an `/api/search/hybrid` — hybrid BM25+Vektor-Suche.
   - **Privacy-Modus:** In-Browser 384-d Cosinus-Suche ueber den lokalen Corpus (kein Netzwerk-Request).
5. Ergebnisse erscheinen in einer scrollbaren Liste; Enter oder Klick navigiert zur Zielseite.
6. ESC schliesst die Palette.

## Einfachheit & Fuehrung

- **Keine Einrichtung noetig:** Die Palette ist immer aktiv.
- **Tastatur-first:** Alle Aktionen (navigieren, auswaehlen, schliessen) sind per Tastatur ausfuehrbar.
- **Fehlertoleranz:** Bei 403 (Feature deaktiviert) oder Netzwerkfehler degradiert die Palette auf reinen Substring-Filter ueber den statischen NAV-Items — kein leerer Zustand.
- **Privacy-Indikator:** Wenn Privacy-Mode aktiv ist, wird der lokale Suchpfad benutzt; der Nutzer wird nicht gesondert informiert (die UX ist identisch, nur schneller).

## Wie es funktioniert (technisch, knapp)

| Schicht | Datei |
|---------|-------|
| Komponente | `src/components/shared/command-palette.tsx` |
| Hybrid-Search-API | `src/app/api/search/hybrid/route.ts` (POST) |
| Lokale Suche (Privacy) | `src/lib/search/local-search.ts` |
| Privacy-Hook | `src/hooks/use-privacy-mode.ts` |
| Feature-Flag | `hybrid-search` (defaultEnabled: true) |

**Sicherheit:** Nur Pfade aus einer statischen Allowlist (`ALLOWED_PATH_PREFIXES`) koennen per `router.push` navigiert werden — Open-Redirect-Angriffe sind nicht moeglich.

**Corpus (Privacy-Mode):** Sechs hardcodierte Best-Practice-Titel/-Excerpts in `LOCAL_CORPUS` (in der Komponente definiert). Diese muessen manuell mit dem Demo-Datenstand in `best-practices/page.tsx` synchron gehalten werden.

**Debounce:** 200ms — verhindert uebermassige API-Aufrufe beim schnellen Tippen.

## Status & Grenzen

| Aspekt | Stand |
|--------|-------|
| Cmd/Ctrl+K oeffnet Palette | Live |
| Schnellnavigation (10 Ziele) | Live |
| Hybrid-Search (Server) | Live, Feature-Flag aktiv |
| Privacy-Mode-Suche (lokal) | Live, aber Corpus ist ein statischer Demo-Stub (6 Eintraege) |
| Corpus automatisch aktualisiert | Nicht live — Corpus ist hardcodiert in der Komponente |
| Volltextsuche auf Community-Posts / Kursen | Nicht live — nur Best Practices indexiert |
