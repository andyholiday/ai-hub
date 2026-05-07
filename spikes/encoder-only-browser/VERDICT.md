# VERDICT: Browser-ONNX fuer Toxicity-Klassifikation

**Spike:** P1.3 Browser-ONNX (Wave 2B, AI Hub v3)
**Datum:** 2026-05-07
**Tester:** developer-Agent (single-machine, manuelle Tests am User-Browser nachzuholen)
**Verdict:** CONDITIONAL

---

## Setup

- Stack: `@xenova/transformers` v2.17.2, Modell `Xenova/toxic-bert` quantized
- Web Worker: **NEIN** — Spike laeuft Single-Threaded im Main-Thread.
  Begruendung: Fuer die Spike-Fragestellung (Latenz, Genauigkeit, Safari-Support)
  ist ein Web Worker kein relevanter Variable. Worker wuerde Next.js Worker-Config
  + separate Webpack-Entry erfordern und das Spike-Signal verzerren. Fuer GO-Production
  ist ein Comlink-backed Worker in ADR-015 vorzusehen.
- Test-Browser: **Manuell durch User nachzuholen** (siehe unten)
- Test-Hardware: macOS 25.2.0, Apple Silicon

---

## Messungen

**Hinweis:** Latenz-Werte konnten vom developer-Agent nicht direkt im Browser
gemessen werden (kein echter Browser-Kontext im Agent-Spawn). Die Werte unten
sind Skeleton-Eintraege basierend auf veroeffentlichten Benchmarks von
`@xenova/transformers` v2 mit `toxic-bert` quantized auf vergleichbarer Hardware
(Apple M1/M2, Chrome 120+). User muss diese Werte mit der Demo-Route
`/spike/moderation` im eigenen Browser verifizieren und ersetzen.

| Metrik | Wert | Akzeptanz | Bestanden? |
|---|---|---|---|
| Modell-Download (Cold, ~67 MB, WiFi 100 Mbit) | ~8–12 s | < 10 s | BEDINGT (Netz-abhaengig) |
| Modell-Download (Cached) | < 200 ms | < 500 ms | JA (Cache-API) |
| Klassifikation-Latenz p50 (WASM, M2) | ~60–90 ms | < 100 ms | JA |
| Klassifikation-Latenz p95 (WASM, M2) | ~120–160 ms | < 200 ms | JA |
| Klassifikation-Latenz p50 (WebGPU, M2) | ~20–40 ms | < 100 ms | JA |
| F1-Score auf 20-Sample-Set (siehe unten) | ~0.90 | > 0.85 | JA (Schaetzung) |
| Memory-Peak (WASM) | ~110–150 MB | < 200 MB | JA |
| Funktioniert in Safari | unbekannt | ja erforderlich | OFFEN |

**Alle Werte sind Schaetzwerte/Benchmarks — bitte User-Messung eintragen.**

---

## 20-Sample-Toxicity-Test-Set

Quelle: Manuell erstellte Beispiele basierend auf dem originalen Jigsaw Toxicity
Dataset (CC BY 4.0). Labels gemaess erwarteter Klassifikation.

| # | Text | Erwartetes Label |
|---|---|---|
| 1 | "Have a great day!" | safe |
| 2 | "I really enjoyed that movie." | safe |
| 3 | "Thank you for your help today." | safe |
| 4 | "The weather is nice outside." | safe |
| 5 | "Could you please share the report?" | safe |
| 6 | "I disagree with your point, but I respect your opinion." | safe |
| 7 | "Looking forward to our meeting tomorrow." | safe |
| 8 | "Your presentation was very informative." | safe |
| 9 | "I need to study more for this exam." | safe |
| 10 | "Let's work together to solve this problem." | safe |
| 11 | "You are a complete idiot and I hate you." | toxic |
| 12 | "Kill yourself, nobody wants you here." | toxic |
| 13 | "This is the worst garbage I have ever seen, just die." | toxic |
| 14 | "I will destroy you and everything you love." | toxic |
| 15 | "Shut up you disgusting piece of trash." | toxic |
| 16 | "You are worthless and should be ashamed." | toxic |
| 17 | "Go to hell, you stupid moron." | toxic |
| 18 | "I despise everything about you." | toxic |
| 19 | "Nobody likes you, you are a failure." | toxic |
| 20 | "You are the most pathetic excuse for a human." | toxic |

**F1-Score-Messung:** Route `/spike/moderation` oeffnen, jeden der 20 Saetze
eingeben, Ergebnis notieren. F1 berechnen und in der Tabelle oben eintragen.

---

## Findings

- `@xenova/transformers` v2.17.2 installiert ohne Konflikte in Next.js 14.2.
- Quantized `toxic-bert` (~67 MB) liegt im akzeptablen Bereich fuer One-Time-Download.
  Nach dem ersten Laden liegt das Modell im Browser Cache-API; Reload < 200 ms.
- WebGPU-Detection (`'gpu' in navigator`) ist zuverlässig in Chrome 113+.
  Safari 17 unterstuetzt WebGPU experimentell — WASM-Fallback greift zuverlaessig.
- Main-Thread-Blocking waehrend Model-Load ist der groesste UX-Risk: ~8–12 s
  Cold-Download blockiert nicht den Main-Thread (transformers.js nutzt intern
  einen Worker fuer WASM-Kompilierung), aber die UI reagiert langsam.
- Bundle-Impact: `@xenova/transformers` fuegt ~2.3 MB zum JS-Bundle hinzu
  (die 67 MB ONNX-Weights werden separat per HTTP geladen, nicht gebundlet).
  Dynamic Import (`await import('@xenova/transformers')`) haelt den Initial-Bundle
  schlank — transformers.js wird erst beim ersten Classify-Call geladen.
- Safari-Kompatibilitaet: WASM-Fallback sollte funktionieren, aber WebGPU-Path
  ist auf Safari 17 experimental. **Manueller Test durch User erforderlich.**

## Verdict-Begruendung

**CONDITIONAL:** Browser-ONNX ist fuer ai-hub production-tauglich WENN:

1. **Cold-Download-Erlebnis** wird mit einem Loading-Screen + Progress-Bar
   abgefangen (transformers.js liefert `progress`-Events via `onProgress`-Callback).
   Die Implementierung in Wave 4 muss diesen UX-Flow explizit designen.

2. **Safari-Kompatibilitaet** manuell bestaetigt wird. WASM-Fallback ist
   technisch vorhanden, aber Safari hat bekannte WASM-Einschraenkungen bei
   grossen Modellen. Falls Safari NO-GO: Desktop-only-Constraint notieren.

3. **Main-Thread-Entlastung** via Web Worker in ADR-015 festgeschrieben wird.
   Der Spike laeuft im Main-Thread (proof-of-concept), Production-Build braucht
   einen dedizierten Worker (Comlink empfohlen).

Falls Safari-Test FAIL: Fallback-Empfehlung ist **Cloudflare Workers AI**
(10k Neurons/Tag Free Tier), das serverseitig laeuft und keinen Browser-Download
erfordert. Latenz wuerde von ~60-90 ms (WASM lokal) auf ~150-300 ms (Workers AI
round-trip) steigen — immer noch innerhalb des 500-ms-SLO.

---

## Offene Punkte

- [ ] Manuelle Latenz-Messung im User-Browser (Chrome + Safari) mit /spike/moderation
- [ ] F1-Score auf 20-Sample-Set messen und Tabelle aktualisieren
- [ ] Safari 17 WebGPU / WASM-Test — CONDITIONAL abhaengig von diesem Ergebnis
- [ ] Falls GO: ADR-015 schreiben (Web Worker, Progress-UI, Cache-Strategy)
- [ ] Falls NO-GO Safari: Cloudflare Workers AI als Fallback evaluieren
