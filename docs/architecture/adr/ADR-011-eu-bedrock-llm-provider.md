# ADR-011: Privacy Mode — EU-Bedrock als datenschutzkonformer LLM-Provider (Pattern 4.2)

**Status:** Superseded by ADR-013  
**Datum:** 2026-05-06

> **Superseded:** Diese Entscheidung wurde am 2026-05-07 durch
> [ADR-013](ADR-013-mistral-eu-privacy-provider.md) ersetzt. Begründung:
> Free-Tier-Constraint (ai-hub muss 0€/Monat Fixkosten halten), Mistral
> La Plateforme Experiment-Tier bietet permanent free EU-LLM-Inferenz mit DPA.

---

## Kontext

Im Privacy Mode dürfen LLM-Calls für Funktionen, die ohne serverseitige KI nicht realisierbar sind (z.B. Chat-Completion im Privacy-Modus), nur über Datenzentren innerhalb der EU laufen. Anthropic und OpenAI betreiben ihre primären API-Endpunkte in den USA (Datenübermittlung an Drittland). AWS Bedrock bietet Anthropic-Modelle (Claude 3.x) in der Region `eu-central-1` (Frankfurt) an und ermöglicht einen AVV (Auftragsverarbeitungsvertrag) gemäß DSGVO Art. 28.

---

## Entscheidung

Wir integrieren **AWS Bedrock in Region `eu-central-1`** als separaten AI-Provider im bestehenden Multi-Provider-Router (`src/lib/ai/providers/`). Im Privacy Mode wird der Router zwingend auf diesen Provider umgeleitet. Standard-Modell: `anthropic.claude-3-haiku-20240307-v1:0` (Cost-Efficiency). Der AVV wird auf AWS-Ebene konfiguriert — keine Code-Änderung nötig. Credentials via `@aws-sdk/client-bedrock-runtime` mit IAM-Role (nicht Access-Key) in Produktionsumgebung.

---

## Konsequenzen

- (+) Daten verlassen die EU nicht — DSGVO Art. 44+ (Drittland-Transfer) entfällt.
- (+) AVV mit AWS möglich und dokumentiert (AWS Data Processing Addendum).
- (+) Anthropic-Modelle verfügbar — keine Prompt-Migration nötig.
- (-) AWS-IAM-Setup und Bedrock-Quota-Freischaltung erfordern manuellen Ops-Aufwand (~2 h einmalig).
- (-) Bedrock hat eigene Pricing-Struktur — `src/lib/ai/pricing.ts` (Phase 2.1) muss Bedrock-Preise ergänzen.
- (-) `@aws-sdk/client-bedrock-runtime` ist ein neues Dependency (~200 KB, aber Tree-shakeable).
- (neutral) Latenz eu-central-1 für EU-User: ~50–80 ms (vergleichbar direktem Anthropic-API).

---

## Alternativen

- **Azure OpenAI EU-Regions:** GPT-4o in `swedencentral` oder `francecentral`. Kein AVV-Problem, aber OpenAI-Modelle statt Anthropic — Prompt-Kompatibilität muss geprüft werden. Als Fallback dokumentiert, nicht primär gewählt.
- **Mistral EU-Hosting (Paris):** Europäisches Unternehmen, DSGVO-nativ. Aber schwächere Modell-Qualität für komplexe Reasoning-Tasks. Abgelehnt als Primär-Provider für Privacy Mode.
- **Self-Hosted Ollama:** Maximale Kontrolle, aber Infra-Aufwand inakzeptabel für aktuelles Team-Size.

---

## References

- AWS Bedrock Regions: https://docs.aws.amazon.com/bedrock/latest/userguide/bedrock-regions.html
- AWS DSGVO/AVV: https://aws.amazon.com/compliance/gdpr-center/
- Pitch Deck v3: `docs/pitch-deck-v3.html`, Säule 4 Pattern 4.2
