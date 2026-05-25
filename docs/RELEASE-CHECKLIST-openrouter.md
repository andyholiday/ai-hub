# Release Checklist: OpenRouter Provider

Branch: `preview-merge-2026-05-13`

## Vorbedingung: Build-Fehler beheben

**BLOCKER:** `npm run build` schlaegt fehl mit:

```
./src/app/api/cron/route.ts:28:12
Type error: Property 'timingSafeEqual' does not exist on type 'Crypto'.
```

Ursache: Die `lib`-Einstellung in `tsconfig.json` enthaelt `"dom"`, wodurch das
globale `crypto`-Objekt als `SubtleCrypto` getypt wird, das kein
`timingSafeEqual` kennt. Der Named Import `timingSafeEqual` aus `node:crypto`
ist korrekt, aber TypeScript loest an dieser Zeile trotzdem das globale `crypto`
auf (Bug in der Typaufloesung oder Zeilenverschiebung durch Cache).

Schnellfix (Verantwortlicher: Developer): Import auf Named Import sicherstellen
und Aufruf als freie Funktion — nicht als `crypto.timingSafeEqual(...)`. Pruefen,
ob `@types/node` in `devDependencies` vorhanden ist, und `node` in `tsconfig.lib`
ergaenzen falls noetig.

---

## Schritt 1: Supabase-Umgebungsvariablen pruefen

```bash
vercel env ls preview
```

Pruefen ob folgende Variablen zur **Produktionsdatenbank** zeigen (nicht zu einer
lokalen/branch-isolierten DB):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Hinweis: Wenn die Preview-Umgebung gegen eine andere DB-Instanz zeigt als die
Produktion, ist der OpenRouter-Eintrag moeglicherweise dort nicht migriert.

---

## Schritt 2: DB-Stand auf der Preview-Branch-DB pruefen

Einloggen in Supabase Studio oder via psql und folgenden Query ausfuehren:

```sql
SELECT count(*) FROM ai_providers;
```

Erwarteter Wert: **7**

Wenn der Wert kleiner ist (z.B. 6), fehlt der OpenRouter-Eintrag. In diesem Fall
Migration einspielen:

**Option A — via Supabase CLI (empfohlen):**

```bash
npx supabase db push --linked
```

**Option B — direkt via psql:**

```bash
psql "$DATABASE_URL" -f supabase/migrations/00030_add_openrouter_to_known_providers.sql
```

Migration-Datei: `supabase/migrations/00030_add_openrouter_to_known_providers.sql`

---

## Schritt 3: Preview-Deployment erzwingen

Nach dem Build-Fix und der DB-Verifikation ein neues Deployment triggern:

**Option A — Vercel CLI:**

```bash
vercel --prod=false
```

**Option B — Vercel Dashboard:**

Unter "Deployments" den letzten Preview-Deploy auswaehlen und "Redeploy" klicken
(ohne Cache, um stale `.next`-Output auszuschliessen).

---

## Schritt 4: Im Browser verifizieren

1. Auf der Preview-URL einloggen (Admin-Account).
2. Browser DevTools oeffnen, Reiter "Network".
3. Zum Admin-Panel navigieren (Providers-Seite).
4. Request `GET /api/admin/providers` suchen.
5. Response-Body pruefen: `openrouter` muss in der Provider-Liste enthalten sein.

Erwartet:

```json
[
  { "id": "...", "name": "openrouter", ... },
  ...
]
```

---

## Referenz

- Source: `src/app/api/admin/providers/route.ts` — kein Filter, Query gibt alle
  Zeilen aus `ai_providers` zurueck.
- Migration: `supabase/migrations/00030_add_openrouter_to_known_providers.sql`
- ADR: `docs/adr/` (Provider-Architektur)
