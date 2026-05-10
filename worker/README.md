# Flowi API Worker

Cloudflare Worker that proxies the mobile app's Anthropic calls so the real API key never ships in the bundled binary.

## Setup

```sh
cd worker
npm install
cp .dev.vars.example .dev.vars
# edit .dev.vars and fill in ANTHROPIC_API_KEY + a generated FLOWI_API_KEY
```

Generate a FLOWI_API_KEY:

```sh
openssl rand -hex 32
```

## Local dev

```sh
npm run dev
# Worker is now at http://localhost:8787
```

Point the app at it by setting in the project root `.env.local`:

```
EXPO_PUBLIC_FLOWI_API_URL=http://localhost:8787
EXPO_PUBLIC_FLOWI_KEY=<the FLOWI_API_KEY value from .dev.vars>
```

## Deploy

Set production secrets (run once):

```sh
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put FLOWI_API_KEY
```

Deploy:

```sh
npm run deploy
```

Wrangler prints the deployed URL (e.g. `https://flowi-api.<account>.workers.dev`). Update the app's production env (`.env.production` or EAS secrets) with that URL.

## Endpoints

- `POST /v1/messages` — forwards to `https://api.anthropic.com/v1/messages`. Requires `X-Flowi-Key` header. Body is the standard Anthropic Messages API request. If `system` is a plain string, the Worker wraps it with `cache_control: ephemeral` so multi-turn coach sessions benefit from prompt caching.
- `GET /healthz` — liveness probe (no auth).

## Watching logs

```sh
npm run tail
```
