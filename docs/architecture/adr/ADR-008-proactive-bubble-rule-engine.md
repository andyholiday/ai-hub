# ADR-008: Proaktive Orb-Kommentare — Regelbasierte Engine ohne LLM (Layer 3.2)

**Status:** Accepted  
**Datum:** 2026-05-06

---

## Kontext

Der Orb soll proaktiv kontextrelevante Kommentare als Sprechblasen anzeigen, wenn ein User z.B. lange auf einer Sektion verweilt, einen Code-Block scrollt oder nach einem Suchbegriff gesucht hat. Die naheliegende Lösung wäre ein LLM-Call pro Trigger-Event. Das erzeugt jedoch Latenz (500–2000 ms), Kosten (jeder Page-View kann einen API-Call auslösen) und DSGVO-Fragen (passive Beobachtung ohne explizite Interaktion). Die Bubble-Texte sind redaktionell kontrolliert — kein generativer Output nötig.

---

## Entscheidung

Wir implementieren eine **statische TypeScript Rule-Engine** mit `ts-pattern` für typsichere Pattern-Matching auf Event-Typen. Kein LLM-Call. Texte sind fest hinterlegt (6–8 Trigger, deutsch, redaktionell geprüft). Frequency-Cap: maximal 1 Bubble pro Session. 24 h Cooldown via `localStorage`-Timestamp. Trigger-Events: Scroll-Dwell (30 s auf einer Sektion), Code-Block-Sichtbarkeit, Suchanfrage ohne Ergebnis, Inaktivität > 90 s, XP-Milestone, erster AI-Chat.

---

## Konsequenzen

- (+) Null LLM-Kosten für passive Observation.
- (+) Deterministisch testbar — jede Trigger-Bedingung ist unit-testbar.
- (+) DSGVO-konform: kein Daten-Upload für Bubble-Logik.
- (+) `ts-pattern` ermöglicht exhaustive-Match-Prüfung zur Compile-Zeit.
- (-) Texte sind statisch — kein echtes Personalisierungs-Potenzial.
- (-) Neue Trigger erfordern Code-Deploy statt Prompt-Edit.
- (neutral) `ts-pattern` ist eine neue Dependency (~8 KB gzipped).

---

## Alternativen

- **LLM-basierte Bubble-Generierung:** Personalisiert, aber Latenz + Kosten + DSGVO-Risiko. Abgelehnt wegen passivem Tracking ohne expliziten User-Intent.
- **Eigenes switch/if-else ohne ts-pattern:** Möglich, aber exhaustiveness-Checks gehen verloren. Bei 6–8 Triggern ist ts-pattern die bessere Wartbarkeits-Investition.

---

## References

- ts-pattern: https://github.com/gvergnaud/ts-pattern
- Pitch Deck v3: `docs/pitch-deck-v3.html`, Säule 3 Layer 3.2
