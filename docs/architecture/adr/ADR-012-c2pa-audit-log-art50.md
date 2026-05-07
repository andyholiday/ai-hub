# ADR-012: Privacy Mode — C2PA v2.4 Audit-Log für Art. 50 KI-Transparenz (Pattern 4.3)

**Status:** Accepted  
**Datum:** 2026-05-06

---

## Kontext

EU AI Act Art. 50 verlangt für KI-generierte Inhalte eine Kennzeichnungspflicht (in Kraft schrittweise ab 2025). C2PA (Coalition for Content Provenance and Authenticity) v2.4 ist der De-facto-Standard für maschinenlesbare Herkunftsnachweise. Das Audit-Log soll dokumentieren: welches Modell, wann, mit welchem Provider, welche Antwort generiert hat — verankert in einem C2PA-Manifest, das an den Response angehängt wird.

Alternativer Ansatz: einfaches Datenbanklog ohne C2PA-Struktur. Das würde Art. 50 formal nicht erfüllen, da maschinenlesbare Interoperabilität fehlt.

---

## Entscheidung

Wir implementieren einen **Audit-Log-Service** (`src/lib/audit/c2pa-manifest.ts`), der pro AI-Chat-Response ein C2PA-v2.4-Manifest als JSON erzeugt und in Supabase (`audit_logs`-Tabelle) persistiert. Das Manifest enthält: `model_id`, `provider`, `region`, `timestamp`, `user_id` (pseudonymisiert via SHA-256-Hash), `privacy_mode: boolean`, `content_hash` (SHA-256 des Response-Texts). Kein echtes C2PA-Signing (erfordert PKI-Setup) in Phase 1 — nur das Manifest-Schema. Signing als Phase-2-Erweiterung dokumentiert.

---

## Konsequenzen

- (+) Art. 50-konforme, strukturierte Transparenz-Aufzeichnung.
- (+) Audit-Log ist querybar (Supabase Postgres) — einfache DSGVO-Auskunfts-Requests.
- (+) C2PA-Schema ist extensibel — Signing nachrüstbar ohne Schema-Migration.
- (-) Jeder AI-Response erzeugt einen DB-Write — Latenz +5–15 ms pro Request.
- (-) Ohne echtes C2PA-Signing ist das Manifest nicht kryptographisch verifizierbar (dokumentierte Limitation).
- (-) Pseudonymisierung via SHA-256 ist nicht reversibel — Recht auf Auskunft (Art. 15) muss über User-ID-Mapping in separater Tabelle gelöst werden.

---

## Alternativen

- **Einfaches Datenbanklog (kein C2PA):** Weniger Aufwand, aber nicht Art. 50-konform und nicht interoperabel. Abgelehnt.
- **Vollständiges C2PA-Signing mit X.509-PKI:** Art. 50-optimal, aber Certificate-Management-Aufwand ist für aktuelle Phase unverhältnismäßig. Als Upgrade-Pfad in ADR verankert.
- **Blockchain-Audit-Trail:** Dezentral, unveränderlich, aber Infrastruktur-Overhead und Kosten nicht rechtfertigbar. Abgelehnt.

---

## References

- C2PA Spec v2.4: https://c2pa.org/specifications/specifications/2.4/specs/C2PA_Specification.html
- EU AI Act Art. 50: https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32024R1689
- Pitch Deck v3: `docs/pitch-deck-v3.html`, Säule 4 Pattern 4.3
