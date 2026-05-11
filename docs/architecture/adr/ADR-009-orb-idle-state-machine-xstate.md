# ADR-009: Living Orb v2 — Idle-State-Machine mit XState v5 (Layer 3.3)

**Status:** Accepted  
**Datum:** 2026-05-06

---

## Kontext

Der Orb soll im Idle-Zustand "lebendig" wirken durch mehrschichtige Mikro-Animationen: Atemrhythmus (3 s Zyklus), Mini-Idle alle 45–90 s (kurze Bewegungssequenz), und ein seltenes Easter-Egg (5 % Wahrscheinlichkeit nach 3 min Inaktivität). Zusätzlich soll das Idle-Verhalten Tageszeit-aware sein (ruhigere Animationen nachts). Die aktuelle Framer-Motion-Animation ist zustandslos — der Orb "weiß" nicht, wie lange er schon wartet.

XState v5 ist nicht im Projekt. Framer Motion allein kann Timeouts und probabilistische Transitions nicht modellieren. useReducer + useEffect wäre möglich, aber erzeugt ab 4+ States schwer wartbaren Code.

---

## Entscheidung

Wir verwenden **XState v5** (`createMachine`, `@xstate/react` `useMachine`) für die Idle-State-Machine des Orbs. XState v5 ist leichter als v4 (kein Context-Objekt-Overhead für einfache Machines, Tree-Shaking-fähig). Die Machine selbst ist framework-agnostisch und vollständig unit-testbar ohne DOM.

State-Hierarchie:
- `active` (User interagiert oder bewegt sich)
- `idle.breathing` (Default-Idle, loop 3 s)
- `idle.mini` (45–90 s Inaktivität, kurze Bewegungssequenz ~2 s)
- `idle.maxi` (nach 3 min, 5 % Zufall, Easter-Egg ~4 s)
- `muted` (prefers-reduced-motion oder User-Toggle)

Tageszeit-awareness wird als Guard beim Eintritt in `idle.mini` und `idle.maxi` implementiert: Zwischen 22:00–07:00 wird die Animation-Intensität auf 40 % gedrosselt (via `context.timeOfDay`-Variable).

---

## Konsequenzen

- (+) Deterministisch testbar — `createActor(machine).send(...)` ohne Render-Kontext.
- (+) Visuelle State-Charts dokumentieren die Logik für Designer und Reviewer.
- (+) Probabilistische Transitions (`maxi` Easter-Egg) sind in XState über `choose`-Action sauber modellierbar.
- (-) Neue Dependency (`xstate` + `@xstate/react`, zusammen ~25 KB gzipped).
- (-) XState v5 API-Syntax weicht von v4 ab — keine bestehende v4-Migration nötig (kein XState bisher im Projekt).
- (neutral) Die Machine muss beim Route-Wechsel re-initialisiert werden (Next.js App Router — kein globaler State ohne Provider).

---

## Alternativen

- **useReducer + useEffect:** Kein neues Dependency, aber Timer-Management in Effects ist fehleranfällig (Race-Conditions bei Cleanup). Nicht skalierbar über 4 States.
- **Framer Motion `AnimatePresence` + `useAnimate`:** Gut für Animations-Sequenzen, aber keine State-Timeout-Logik oder probabilistische Guards. Abgelehnt.
- **Zustand (bereits im Projekt):** Gut für globalen State, nicht für hierarchische State-Machines mit Timeouts. Falsches Tool.

---

## References

- XState v5 Docs: https://stately.ai/docs/xstate
- Pitch Deck v3: `docs/pitch-deck-v3.html`, Säule 3 Layer 3.3
