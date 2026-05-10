/**
 * Flowi API Worker — proxies the mobile app's Anthropic calls.
 *
 * Why: the Anthropic key cannot ship in the bundled IPA/APK (extractable from
 * any installed binary). The app sends X-Flowi-Key; we swap it for x-api-key
 * and forward to api.anthropic.com.
 *
 * Endpoints
 *   POST /v1/messages   forwards to Anthropic's Messages API (streaming-safe)
 *   GET  /healthz       liveness probe (no auth)
 *
 * Secrets (set via `wrangler secret put`):
 *   ANTHROPIC_API_KEY   the real sk-ant-... key
 *   FLOWI_API_KEY       shared secret the app sends as X-Flowi-Key
 */

interface Env {
  ANTHROPIC_API_KEY: string;
  FLOWI_API_KEY: string;
}

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Flowi-Key',
  'Access-Control-Max-Age': '86400',
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { type: 'flowi_error', message } }), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

/**
 * Constant-time string comparison to avoid timing oracles on the shared secret.
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Inject `cache_control: ephemeral` on the system prompt so multi-turn coach
 * conversations benefit from prompt caching automatically. If the client
 * already structured `system` as an array (with or without cache_control),
 * leave it alone.
 */
function injectPromptCache(body: Record<string, unknown>): Record<string, unknown> {
  const system = body.system;
  if (typeof system === 'string' && system.length > 0) {
    return {
      ...body,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    };
  }
  return body;
}

async function handleMessages(request: Request, env: Env): Promise<Response> {
  // Auth
  const flowiKey = request.headers.get('X-Flowi-Key');
  if (!flowiKey || !safeEqual(flowiKey, env.FLOWI_API_KEY)) {
    return jsonError(401, 'Invalid or missing X-Flowi-Key');
  }

  // Parse + transform the body
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, 'Body must be valid JSON');
  }
  const transformed = injectPromptCache(body);

  // Forward to Anthropic
  const upstream = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(transformed),
  });

  // Pass response through verbatim (body is a stream — works for streaming and non-streaming)
  const responseHeaders = new Headers(upstream.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) responseHeaders.set(k, v);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/healthz') {
      return new Response('ok', { status: 200, headers: CORS_HEADERS });
    }

    if (url.pathname === '/v1/messages' && request.method === 'POST') {
      return handleMessages(request, env);
    }

    return jsonError(404, `Unknown route: ${request.method} ${url.pathname}`);
  },
} satisfies ExportedHandler<Env>;
