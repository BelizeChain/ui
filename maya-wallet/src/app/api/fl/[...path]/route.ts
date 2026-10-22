import { NextResponse, type NextRequest } from 'next/server';

/**
 * Server-side proxy to the Nawal federated-learning API.
 *
 * The coordinator's `/api/v1/fl/*` routes require an `X-API-Key`, and a browser
 * cannot hold one — so every read from the wallet answered 401, which the
 * /nawal page rendered as an empty tile. This route runs on the server, adds
 * the key, and returns only the payload, so the credential never reaches the
 * client.
 *
 * Mounted at `/api/fl/…` rather than `/api/nawal/…` on purpose: nginx owns
 * `/api/nawal/` and proxies it straight to the coordinator, so a Next route
 * under that prefix would never be reached.
 */

/** Only the reads the wallet performs; this must not become an open proxy. */
const ALLOWED_PATHS = [
  /^metrics$/,
  /^participants\/[A-Za-z0-9]+$/,
  /^rounds\/[A-Za-z0-9_-]+$/,
];

/** The coordinator's own prefix, appended after the internal base URL. */
const UPSTREAM_PREFIX = '/api/v1/fl';

const TIMEOUT_MS = 5000;

function isAllowed(path: string): boolean {
  return ALLOWED_PATHS.some((pattern) => pattern.test(path));
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  const joined = path.join('/');

  if (!isAllowed(joined)) {
    // 404 rather than 403: the allowlist is an implementation detail, and the
    // caller has no way to satisfy it for a path that was never offered.
    return NextResponse.json({ detail: 'Not found' }, { status: 404 });
  }

  const base = process.env.NAWAL_INTERNAL_URL;
  const apiKey = process.env.NAWAL_API_KEY;

  if (!base || !apiKey) {
    // Say which one is missing rather than returning an empty 200 — a silent
    // fallback here would look identical to "no data yet", which is the exact
    // failure this route exists to remove.
    const missing = [!base && 'NAWAL_INTERNAL_URL', !apiKey && 'NAWAL_API_KEY']
      .filter(Boolean)
      .join(', ');
    return NextResponse.json(
      { detail: `Nawal proxy is not configured: ${missing} unset` },
      { status: 503 },
    );
  }

  const upstreamUrl = `${base.replace(/\/$/, '')}${UPSTREAM_PREFIX}/${joined}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { 'X-API-Key': apiKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const body = await upstream.text();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
        // The coordinator's answer is scoped to this request; caching it would
        // serve one account's participant stats to another.
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error && error.name === 'TimeoutError'
            ? `Nawal did not answer within ${TIMEOUT_MS}ms`
            : 'Nawal is unreachable',
      },
      { status: 504 },
    );
  }
}
