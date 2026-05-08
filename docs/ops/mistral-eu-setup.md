# Mistral EU Privacy Provider — Setup Guide

ADR-013: Mistral La Plateforme Experiment-Tier als EU-Privacy-Mode-Provider (Pattern P4.2).

## Voraussetzungen

- Account bei [Mistral La Plateforme](https://console.mistral.ai/)
- Experiment-Tier-Plan (kostenlos, kein Ablaufdatum)

## API-Key erstellen

1. Einloggen unter [console.mistral.ai](https://console.mistral.ai/).
2. Links im Menu: **API Keys** > **Create new key**.
3. Name: z.B. `ai-hub-privacy-mode`.
4. Tier: **Experiment** (kostenlos, 2 req/min).
5. Key kopieren — er wird nur einmal angezeigt.
6. Weitere Infos zum Experiment-Plan:
   [help.mistral.ai/en/articles/455206](https://help.mistral.ai/en/articles/455206)

## Umgebungsvariable setzen

In `.env.local` (niemals committen):

```bash
MISTRAL_EU_API_KEY=dein-experiment-tier-key-hier
```

Auf Vercel: **Settings > Environment Variables** > `MISTRAL_EU_API_KEY` hinzufügen
(Environment: Production + Preview).

Wichtig: `MISTRAL_EU_API_KEY` ist ein separater Key vom Standard `MISTRAL_API_KEY`.
Beide können parallel existieren.

## ⚠ Wichtig: Training-Klausel im Experiment-Tier

Der Experiment-Tier nutzt Anfrage-Daten moeglicherweise fuer Modell-Training.
Fuer Production-Privacy-Mode mit verbindlicher No-Training-Garantie:
Scale-Plan-Upgrade noetig (siehe https://mistral.ai/pricing).

**Verwendung des Experiment-Tiers im AI Hub:**
- Wave-4-POC: Funktionalitaets-Validierung
- Internal Tests: ja
- User-Production: NEIN ohne Scale-Plan

## DSGVO / DPA

Das Data Processing Addendum (DPA) ist verfügbar unter:
[legal.mistral.ai/terms/data-processing-addendum](https://legal.mistral.ai/terms/data-processing-addendum)

- Gültig seit 12. März 2026
- Abdeckung: DSGVO Art. 28, SCCs Module 4
- Infrastruktur: FR-basiert, kein Drittland-Transfer (DSGVO Art. 44+ entfällt)
- Trust Center: [trust.mistral.ai](https://trust.mistral.ai/)

Hinweis zum Experiment-Tier: Anfragen können laut Mistral-Nutzungsbedingungen für
Modell-Training verwendet werden. Für Produktionsanforderungen mit striktem
No-Training-Requirement ist ein Scale-Plan-Upgrade erforderlich (Pay-per-Use).

## Rate-Limit

Der Experiment-Tier erlaubt **2 Anfragen/Minute**.

- Ausreichend für den Privacy-Toggle (Single-User-Feature, niedriges Traffic-Volumen).
- Bei erhöhter Last: Upgrade auf Scale-Plan notwendig (einfacher Key-Tausch, kein Code-Change).
- Der Router gibt bei Rate-Limit-Fehler (HTTP 429) einen klaren Error zurück.

## Verifikation

API-Key einmalig testen (ersetze `$MISTRAL_EU_API_KEY` durch deinen Key):

```bash
curl https://api.mistral.ai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MISTRAL_EU_API_KEY" \
  -H "X-Privacy-Mode: enabled" \
  -d '{
    "model": "mistral-small-latest",
    "messages": [{"role": "user", "content": "Ping"}]
  }'
```

Erwartete Antwort: HTTP 200 mit `choices[0].message.content`.

## Troubleshooting

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| `MISTRAL_EU_API_KEY required for Privacy Mode` | Env-Var fehlt | Key in `.env.local` setzen |
| HTTP 401 | Ungültiger Key | Key in Mistral Console prüfen |
| HTTP 429 | Rate-Limit überschritten | 30 s warten oder Scale-Plan |
| HTTP 403 | Key hat falschen Scope | Neuen Key mit korrektem Tier erstellen |
