# Spike: Browser-ONNX Toxicity-Klassifikation (P1.3)

**Wave:** 2B  
**Branch:** `feature/v3-encoder-only-browser-spike`  
**Datum:** 2026-05-07

---

## Ziel

Evaluierung ob `@xenova/transformers` + `Xenova/toxic-bert` (quantized ONNX)
fuer Toxicity-Moderation im Browser production-tauglich ist — ohne Server,
ohne Fixkosten (0 EUR).

---

## Setup

```bash
# Im Projekt-Root (ai-hub):
npm install @xenova/transformers   # bereits in package.json eingetragen

npm run dev
```

Demo-Route im Browser oeffnen:

```
http://localhost:3000/spike/moderation
```

**Hinweis:** Die Route ist nur in `NODE_ENV=development` erreichbar.
In Production wird auf `/` redirected.

---

## Modell

- Name: `Xenova/toxic-bert`
- Format: ONNX quantized (int8)
- Groesse: ~67 MB (Download beim ersten Aufruf)
- Cache: Browser Cache-API (automatisch durch transformers.js)
- Task: `text-classification`

---

## Caveats

1. **Cold-Download (~67 MB):** Beim ersten Aufruf wird das Modell aus dem
   Hugging Face CDN geladen. Je nach Verbindung 5–15 Sekunden. Die Demo-Page
   zeigt einen Hinweis. Danach aus dem Browser-Cache: < 200 ms.

2. **Main-Thread (Spike):** Die aktuelle Spike-Implementierung laeuft im
   Main-Thread. Fuer Production muss ein Web Worker eingesetzt werden
   (siehe VERDICT.md — Conditional).

3. **WebGPU vs WASM:** Die Implementierung detektiert `'gpu' in navigator`.
   Chrome 113+ liefert WebGPU (~2–3x schneller). Safari und aeltere Browser
   nutzen den WASM-Fallback.

4. **Safari:** WASM-Fallback ist technisch vorhanden, aber noch nicht
   manuell getestet. Vor Production-GO bitte Safari-Test durchfuehren.

---

## Dateistruktur

```
src/lib/moderation/
  types.ts                    — ToxicityScore, ModerationResult, ModelInitState
  browser-classifier.ts       — Singleton Classifier (ONNX, lazy init)
  worker.ts                   — Re-export (Single-Thread fuer Spike)

src/components/features/moderation/
  moderation-spike-page.tsx   — React-Demo-Component

src/app/(dashboard)/spike/moderation/
  page.tsx                    — Next.js Route (DEV only)

tests/unit/lib/moderation/
  browser-classifier.test.ts  — 9 Unit-Tests (Vitest, alle gruen)

spikes/encoder-only-browser/
  VERDICT.md                  — Spike-Ergebnis mit Messungen
  README.md                   — Diese Datei
```

---

## Tests ausfuehren

```bash
npx vitest run tests/unit/lib/moderation/
```

---

## Naechste Schritte (nach manuellem Browser-Test)

- VERDICT.md mit echten Messwerten aktualisieren
- Falls GO: ADR-015 schreiben (Wave 4)
- Falls NO-GO Safari: Cloudflare Workers AI evaluieren
