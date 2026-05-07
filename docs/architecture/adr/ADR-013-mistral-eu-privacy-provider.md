---
id: ADR-013
title: "Mistral La Plateforme (Experiment-Tier) als EU-Privacy-Mode-Provider"
status: Accepted
date: 2026-05-07
supersedes: ADR-011
tags:
  - privacy-mode
  - llm-provider
  - eu-compliance
  - gdpr
  - mistral
---

# ADR-013: Mistral La Plateforme (Experiment-Tier) als EU-Privacy-Mode-Provider (Pattern P4.2)

**Status:** Accepted
**Datum:** 2026-05-07
**Supersedes:** [ADR-011](ADR-011-eu-bedrock-llm-provider.md)

---

## Kontext

Pattern P4.2 (EU-Privacy-Mode LLM) braucht einen LLM-Provider, dessen Inferenz
physisch in der EU stattfindet und der einen DSGVO-konformen AVV (Auftragsverarbeitungsvertrag
gemäß Art. 28 DSGVO) bereitstellt. ADR-011 (AWS Bedrock `eu-central-1`) loeste dieses
Problem korrekt, aber mit erheblichem Ops-Overhead: IAM-Role-Setup, Bedrock-Quota-Freischaltung
und `@aws-sdk/client-bedrock-runtime` als neues Dependency (~200 KB) fuer ein Projekt im
Free-Tier-Betrieb. Da Privacy-Toggle kein Massen-Traffic erzeugt (optionales Feature, aktiviert
von einem Bruchteil der Nutzer), ist ein 0-€-Anbieter mit vertretbaren Rate-Limits vorrangig.

Mistral AI ist ein franzoesisches Unternehmen mit eigener EU-Compute-Infrastruktur (seit
06/2025 in Betrieb). Der Experiment-Tier der Mistral La Plateforme API ist permanent
kostenlos (kein Ablaufdatum, kein Trial-Status) und stellt ein formales Data Processing
Addendum (DPA, gueltig seit 12. März 2026) bereit, das SCCs (Standard Contractual Clauses,
Module 4) und DSGVO Art. 28-konforme Verarbeitung umfasst.

Der bestehende Multi-Provider-Router (`src/lib/ai/router.ts`) unterstuetzt Mistral bereits
namentlich — es existiert kein technisches Hindernis fuer eine Provider-Erweiterung.

---

## Entscheidung

Wir ersetzen AWS Bedrock `eu-central-1` durch **Mistral La Plateforme (Experiment-Tier)**
als exklusiven LLM-Provider im Privacy Mode (Pattern P4.2). Der Router leitet bei aktiviertem
Privacy-Toggle zwingend auf diesen Provider um. Standard-Modell: `mistral-small-latest`
(kostenguenstig, ausreichend fuer Chat-Completion im Privacy-Kontext); `mistral-large-latest`
als optionaler Override. Integration via `@ai-sdk/mistral` (Vercel AI SDK) sofern im Stack
vorhanden — andernfalls direkter HTTPS-Call gegen `https://api.mistral.ai/v1/chat/completions`
ohne SDK-Dependency. API-Key wird als `MISTRAL_API_KEY` in `.env.local` und Vercel-Environment
gefuehrt; niemals im Repository.

---

## Konsequenzen

**Positiv**
- 0 €/Monat Fixkosten gegenueber AWS-Betrieb (kein Pay-per-Use ohne Free-Tier-Aquivalent).
- Kein IAM-Setup, keine Bedrock-Quota-Freischaltung — Ops-Aufwand sinkt von ~2 h auf ~15 min
  (API-Key erzeugen, Env-Variable setzen).
- Mistral ist franzoesisches Unternehmen mit EU-Infrastruktur — Drittland-Transfer
  (DSGVO Art. 44+) entfaellt.
- Formales DPA verfuegbar (https://legal.mistral.ai/terms/data-processing-addendum),
  SCCs als Rueckfallebene.
- `@aws-sdk/client-bedrock-runtime` entfaellt aus `package.json` — Bundle leichter.
- Pattern-P4.2-Aufwand sinkt von S–M auf S (ca. 0.5 Tage statt 1–2 Tage).

**Negativ**
- Experiment-Tier: API-Anfragen koennen fuer Mistral-Modell-Training verwendet werden
  (laut Mistral-Nutzungsbedingungen). Fuer den Privacy Mode muss geprueft werden, ob
  Nutzerdaten das Training beeinflussen — ggf. Scale-Plan-Upgrade notwendig bei skalierten
  Anforderungen.
- Rate-Limit: 2 Anfragen/Minute (Experiment-Tier). Fuer Privacy-Toggle-Traffic akzeptabel;
  bei erhoehter Last muss auf Scale-Plan (Pay-per-Use) umgestellt werden.
- Modell-Auswahl beschraenkt auf Mistral-Familie — keine Anthropic-Modelle verfuegbar.
  Nutzer im Privacy Mode erhalten andere Modell-Charakteristik als im Standard-Mode.
- DPA spezifiziert keinen einzelnen EU-Rechenzentrumsstandort explizit — Mistral verweist
  auf Trust Center (https://trust.mistral.ai/) fuer Infrastruktur-Details.

**Neutral**
- Mistral-Modell-Qualitaet fuer Chat-Completion ist fuer den Privacy-Mode-Use-Case
  ausreichend; kein Regressions-Risiko bei Standard-Nutzung.
- Bei zukuenftigem Wachstum ist Migration auf Scale-Plan (Pay-per-Use) ein einfacher
  Key-Tausch ohne Code-Aenderung.

---

## Alternativen Abgewogen

### Alternative A: AWS Bedrock eu-central-1 (ADR-011)
- Zusammenfassung: Anthropic Claude 3.x in Frankfurt via Bedrock, AVV mit AWS moeglich.
- Abgelehnt weil: Kein Free-Tier, IAM-Setup-Overhead (~2 h Ops) und SDK-Dependency
  (`@aws-sdk/client-bedrock-runtime`) sind unverhältnismaessig fuer ein Privacy-Toggle-Feature
  mit niedrigem Traffic-Volumen in einem 0-€-Budget-Projekt.

### Alternative B: Groq (EU-Proxy)
- Zusammenfassung: Inferenz extrem schnell, guenstiger Preis, Free-Tier vorhanden.
- Abgelehnt weil: Inferenz laeuft auf US-Infrastruktur (keine EU-Datacenter); DSGVO
  Drittland-Transfer unvermeidbar — widerspricht Privacy-Mode-Anforderung fundamental.

### Alternative C: OpenRouter (Free-Tier)
- Zusammenfassung: Aggregiert viele Modelle inkl. EU-Optionen, Free-Tier verfuegbar.
- Abgelehnt weil: Free-Tier instabil (Modelle ohne Ankuendigung entfernt); kein
  eigenes DPA; Kontrolle ueber Datenverarbeitung unklar.

### Alternative D: Browser-Only LLM (ADR-010)
- Zusammenfassung: LLM-Inferenz komplett client-seitig, kein Server-Transfer.
- Abgelehnt als Ersatz fuer P4.2 weil: Browser-Only loest das Privacy-Problem radikaler,
  ist aber ein getrenntes Pattern (P4.1 Local Embeddings / ADR-010). Fuer Chat-Completion
  im Privacy Mode ist On-Device-Inferenz derzeit zu langsam und zu ressourcenintensiv fuer
  produktive Nutzung.

---

## References

- Superseded ADR: [ADR-011](ADR-011-eu-bedrock-llm-provider.md)
- Mistral DPA: https://legal.mistral.ai/terms/data-processing-addendum
- Mistral Experiment-Plan FAQ: https://help.mistral.ai/en/articles/455206
- Mistral Trust Center: https://trust.mistral.ai/
- Plan-v3 Pattern: `docs/IMPLEMENTATION-PLAN-V3.md`, Säule 4, Pattern P4.2
- Innovator-Output: Wave-0a Multi-Agent Re-Eval (2026-05-07)

## Revisions

- 2026-05-07: initial version, supersedes ADR-011
