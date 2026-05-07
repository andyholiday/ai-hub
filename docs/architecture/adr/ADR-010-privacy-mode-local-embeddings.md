# ADR-010: Privacy Mode — Lokale Embeddings mit @xenova/transformers (Pattern 4.1)

**Status:** Accepted  
**Datum:** 2026-05-06

---

## Kontext

AI Hub verarbeitet User-Prompts heute ausschließlich über externe Provider (Anthropic, OpenAI, etc.). Für den Privacy Mode sollen Ähnlichkeitssuchen (Embedding-basierte Retrieval) vollständig im Browser laufen, ohne dass Rohdaten das Gerät verlassen. Zwei Optionen wurden evaluiert: `@xenova/transformers` (Hugging Face Transformers.js, ONNX Runtime Web) und `tensorflow.js` mit einem Universal Sentence Encoder.

---

## Entscheidung

Wir verwenden **`@xenova/transformers@4.x`** mit dem Modell **`Xenova/all-MiniLM-L6-v2`** (22 MB ONNX, quantisiert). Das Modell wird via `self.postMessage`-Web-Worker in einem separaten Thread ausgeführt, damit der Main-Thread nicht blockiert. Beim ersten Privacy-Mode-Aktivieren wird das Modell gecacht via Cache API (Service Worker). Download nur einmalig.

Technische Constraints: Next.js App Router — Worker-Initialisierung via `new Worker(new URL(..., import.meta.url))` im Client-Component. ONNX Runtime Web läuft in modernen Browsern ohne WASM-Flags.

---

## Konsequenzen

- (+) Embedding-Berechnung verlässt nie das Gerät — DSGVO Art. 25 Privacy-by-Design erfüllt.
- (+) all-MiniLM-L6-v2 ist für Deutsch/Englisch ausreichend (384-Dim, Cosine-Similarity).
- (+) 22 MB einmaliger Download ist akzeptabel (vergleichbar einem mittleren Bild-Asset).
- (-) Erste Aktivierung des Privacy Mode dauert 5–15 s (Download + WASM-Init). Fortschrittsanzeige erforderlich.
- (-) iOS Safari 16 hat WASM-Speicherlimits (~1,5 GB) — bei komplexeren Modellen ein Risiko, bei MiniLM unkritisch.
- (-) `@xenova/transformers` v4 ist ein neues Dependency (~340 KB gzipped ohne Modell).

---

## Alternativen

- **TensorFlow.js + Universal Sentence Encoder:** Größeres Modell (>500 MB), langsamere Inference, größeres gzipped Bundle. Abgelehnt.
- **Wasm-Pack eigenes Rust-Modell:** Maximale Kontrolle, Entwicklungsaufwand 3–4 Wochen. Nicht gerechtfertigt.
- **Server-Side mit Encryption:** Embeddings werden serverseitig berechnet, verschlüsselt gespeichert. Daten verlassen aber den Browser — Privacy-Versprechen nicht einlösbar. Abgelehnt.

---

## References

- Transformers.js v4: https://huggingface.co/docs/transformers.js
- Modell: https://huggingface.co/Xenova/all-MiniLM-L6-v2
- Pitch Deck v3: `docs/pitch-deck-v3.html`, Säule 4 Pattern 4.1
