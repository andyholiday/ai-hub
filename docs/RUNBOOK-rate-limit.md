# Runbook: Rate Limiting (Upstash Redis)

## Why Upstash is required in production

ai-hub deploys to Vercel as serverless Lambda functions. Each cold-start
creates a new process with its own memory. The in-memory fallback in
`src/lib/api/rate-limit.ts` uses a `Map` that lives inside that process —
it is not shared between concurrent Lambda instances.

Consequence: with N running instances, every user effectively gets N times
the configured per-tier limit. At scale this means the rate limiter provides
no real protection. Upstash Redis is a shared, low-latency key-value store
that all Lambda instances talk to, giving a single counter per user/IP.

## Setup via Vercel Marketplace (recommended)

1. Open the Vercel Dashboard for this project.
2. Go to **Integrations** → search for **Upstash**.
3. Click **Add Integration** and follow the prompts to create or link an
   Upstash Redis database.
4. Vercel automatically injects `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN` into the project's environment variables for
   all environments (Production, Preview, Development).
5. Redeploy the project — the rate limiter will now use Redis.

## Manual setup

If the Marketplace integration is not available:

1. Create a Redis database at [console.upstash.com](https://console.upstash.com).
2. Copy the **REST URL** and **REST Token** from the database details page.
3. Add them to Vercel: **Project Settings** → **Environment Variables**:
   - `UPSTASH_REDIS_REST_URL` — the REST URL
   - `UPSTASH_REDIS_REST_TOKEN` — the REST token
4. Set scope to **Production** (and optionally Preview).

## What happens without Upstash in production

The module throws at Cold-Start:

```
Error: [rate-limit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are
required in production. In-memory fallback is per-Lambda-instance and
ineffective at scale. ...
```

This surfaces immediately in Vercel Function logs and prevents silent
misconfiguration from reaching users. The deployment will fail fast rather
than quietly serving unprotected endpoints.

## Local development and testing

Leave `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` unset in
`.env.local`. With `NODE_ENV=development` (the Next.js dev server default),
the prod-required check is skipped and the in-memory fallback is used.

The first request that hits the fallback emits a single `warn` log:

```json
{"level":"warn","event":"rate_limit_fallback_active","reason":"Upstash not configured — using per-process in-memory limiter (dev/test only)"}
```

This is intentional and safe locally — a single process handles all requests
in dev, so the counter is accurate.

## Tier reference

| Tier     | Limit         | Typical routes                          |
|----------|---------------|-----------------------------------------|
| `ai`     | 10 req / min  | AI chat, completion, evaluate, auto-tag |
| `search` | 30 req / min  | Semantic search                         |
| `api`    | 60 req / min  | All other API routes                    |
| `auth`   | 5 req / min   | Login, register                         |

## Verifying Redis connectivity

```bash
# From a local terminal with env vars exported:
curl "$UPSTASH_REDIS_REST_URL/ping" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
# Expected: {"result":"PONG"}
```
