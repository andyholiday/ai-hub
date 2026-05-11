# ADR-007: Living Orb v2 — Wandernder Orb mit Scroll-gekoppelter Position (Layer 3.1)

**Status:** Accepted  
**Datum:** 2026-05-06

---

## Kontext

Der bestehende Living Cloud Orb (7 States, position:fixed unten rechts, Framer Motion) ist statisch positioniert. Für AI Hub v3 soll der Orb eine "lebendige" Präsenz entwickeln: Er folgt dem Lese-Kontext des Users durch das Dokument und weicht dem Cursor aktiv aus. Framer Motion ist bereits im Projekt installiert (version ≥ 10). Motion v12 führt `useScroll` + `useSpring` als stabile, performante Primitiven ein. Alternativ wäre ein reiner CSS-Ansatz mit `scroll-timeline` möglich, der jedoch Safari 15 nicht unterstützt und keine Cursor-Ausweich-Logik ermöglicht.

Der Orb muss als Feature-Toggle (Säule 2) steuerbar sein — er bleibt deaktiviert, bis der Toggle-Context bereitsteht.

---

## Entscheidung

Wir verwenden **Framer Motion v12** (`useScroll`, `useSpring`, `useTransform`) kombiniert mit dem nativen **Intersection Observer API** für die Lese-Positions-Detektion. Cursor-Ausweichung via `useMotionValue` + `useSpring` mit 80 px Mindestabstand. Kein CSS `scroll-timeline` (fehlende Safari-Kompatibilität, keine Cursor-Logik).

---

## Konsequenzen

- (+) Framer Motion ist bereits Projekt-Dependency — kein neues Bundle-Gewicht.
- (+) `useSpring` liefert physikalisch plausible, gedämpfte Bewegung ohne manuelles Tweening.
- (+) Intersection Observer ist nativ, kein Polling, kein ResizeObserver-Overhead.
- (-) Motion v12 ist ein Minor-Upgrade von bestehender Installation — Breaking-Change-Check für bestehende Orb-Animations-Props erforderlich.
- (-) Cursor-Tracking via `mousemove`-Listener erzeugt hohe Event-Frequenz — Throttling auf 16 ms (ein Frame) ist Pflicht.
- (neutral) `prefers-reduced-motion`: Wandern wird vollständig deaktiviert, Orb bleibt in Ruheposition unten rechts.

---

## Alternativen

- **CSS `scroll-timeline` (native):** Kein JS-Overhead, aber Safari < 18 nicht unterstützt, und Cursor-Ausweichlogik ist in CSS nicht realisierbar.
- **Vollständig eigene requestAnimationFrame-Schleife:** Maximale Kontrolle, aber ~150 LOC Eigencode statt 3 Motion-Hooks. Nicht gerechtfertigt.

---

## References

- Framer Motion v12 Changelog: https://www.framer.com/motion/
- Pitch Deck v3: `docs/pitch-deck-v3.html`, Säule 3 Layer 3.1
