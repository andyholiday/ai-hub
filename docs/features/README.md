# Feature-Dokumentation — AI Hub

Jede Datei beschreibt ein Feature in seiner aktuell implementierten Form (Stand: 2026-05-22, nach Winston-Audit Wave 1).

## Kern-Features

| Feature | Beschreibung |
|---------|--------------|
| [ai-orb-companion](./ai-orb-companion.md) | Floating Cosmos Companion: animierter KI-Begleiter mit Chat-Panel, Drag-to-Dock und proaktiven Bubbles |
| [ai-orb-search-rag](./ai-orb-search-rag.md) | Orb-Antworten geerdet in RLS-sicherer Hybrid-Suche ueber Best Practices |
| [command-palette-search](./command-palette-search.md) | Cmd/Ctrl+K globale Suche und Navigation, verdrahtet mit `/api/search/hybrid` |
| [privacy-mode-local-search](./privacy-mode-local-search.md) | In-Browser 384-d semantische Suche bei aktivem Privacy-Mode — kein Datentransfer |
| [ai-mentor](./ai-mentor.md) | Dedizierte Multi-Provider-Chat-Seite mit Streaming, Quick-Actions und Session-Persistenz |

## Community & Lernen

| Feature | Beschreibung |
|---------|--------------|
| [community](./community.md) | Forum (Posts, Kommentare, Upvotes) und Idea Board mit KI-Bewertung |
| [learn-hub](./learn-hub.md) | Kurse, Lektionen, Quizzes, Zertifikate und kuratierte Lernpfade |
| [challenges](./challenges.md) | Zeitbasierte Herausforderungen mit XP-Belohnung |
| [leaderboard](./leaderboard.md) | Rangliste nach XP, filterbar nach Woche / Monat / Gesamt |
| [gamification](./gamification.md) | XP, 7 Level, 20 Achievements in 4 Kategorien, 12 Badges, Streak-System |
| [innovation-radar](./innovation-radar.md) | SVG-Radar fuer KI-Technologien nach Adopt / Trial / Assess / Hold |
| [best-practices](./best-practices.md) | Kuratierte Wissensdatenbank mit semantischer Suche und Auto-Tagging |

## Persoenlich & System

| Feature | Beschreibung |
|---------|--------------|
| [dashboard](./dashboard.md) | Personalisierte Einstiegsseite mit Stats, Empfehlungen und Aktivitaets-Feed |
| [profile-and-settings](./profile-and-settings.md) | Profil-Anzeige/-Bearbeitung, Achievements, Dark Mode und Feature-Toggles |
| [notifications](./notifications.md) | Toast-System und Benachrichtigungs-Seite (Seite aktuell Platzhalter) |
| [admin](./admin.md) | Provider-Konfiguration, Sandbox, System-Prompts, Kosten, Content-Moderation |

## Infrastruktur & Querschnittsthemen

| Feature | Beschreibung |
|---------|--------------|
| [ai-provider-routing](./ai-provider-routing.md) | Multi-Provider-Router mit Fallback-Chain, EU-Privacy-Routing und Budget-Cap |
| [security-and-privacy](./security-and-privacy.md) | RLS, Rate-Limiting, Zod, DOMPurify, GDPR-Erasure, C2PA-Audit-Logs |

## Weitere Doku-Dateien in diesem Verzeichnis

| Datei | Inhalt |
|-------|--------|
| [orb-chat-persistence](./orb-chat-persistence.md) | ADR-005-Implementierungs-Details zur Chat-Session-Persistenz |
| [pricing-layer](./pricing-layer.md) | Kosten-Tracking und Budget-Details |
| [gdpr-erasure](./gdpr-erasure.md) | GDPR-Loeschprozess |
| [consent-banner](./consent-banner.md) | Cookie-Consent-Implementierung |
| [dpa-notice](./dpa-notice.md) | Drittanbieter-DPA-Hinweise |
| [api-key-encryption](./api-key-encryption.md) | Vault-basierte Provider-Key-Verschluesselung |
