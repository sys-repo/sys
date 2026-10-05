import { type PreparedInput, snapshotProjection } from './u.input.ts';

const CONTENT_TYPE = 'text/html; charset=UTF-8';
const POLICY_HEADERS = Object.freeze({
  'cache-control': 'no-store',
  'content-security-policy':
    "default-src 'none'; base-uri 'none'; child-src 'none'; connect-src 'none'; font-src 'none'; form-action 'none'; frame-ancestors 'none'; frame-src 'none'; img-src 'none'; manifest-src 'none'; media-src 'none'; object-src 'none'; script-src 'none'; style-src 'unsafe-inline'; worker-src 'none'",
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
});

const FIXED_BYTES = Object.freeze({
  forbidden: encode(
    '<!doctype html><meta charset="utf-8"><title>Forbidden</title><p>Forbidden.</p>',
  ),
  method: encode(
    '<!doctype html><meta charset="utf-8"><title>Method Not Allowed</title><p>Method not allowed.</p>',
  ),
  misdirected: encode(
    '<!doctype html><meta charset="utf-8"><title>Misdirected Request</title><p>Misdirected request.</p>',
  ),
  notFound: encode(
    '<!doctype html><meta charset="utf-8"><title>Not Found</title><p>Not found.</p>',
  ),
  unavailable: encode(
    '<!doctype html><meta charset="utf-8"><title>Unavailable</title><p>Bootstrap status is unavailable.</p>',
  ),
});

export type ResponseContext = PreparedInput & {
  readonly capabilityPath: string;
  readonly origin: string;
};

/** Resolve one admitted observational bootstrap response. */
export function statusResponse(request: Request, context: ResponseContext): Response {
  const url = requestUrl(request);
  if (
    !url ||
    url.pathname !== context.capabilityPath ||
    url.href !== `${url.origin}${url.pathname}`
  ) {
    return fixedResponse(request, 404, FIXED_BYTES.notFound);
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return fixedResponse(request, 405, FIXED_BYTES.method, { allow: 'GET, HEAD' });
  }

  let raw: unknown;
  try {
    raw = context.resolve();
  } catch {
    return fixedResponse(request, 500, FIXED_BYTES.unavailable);
  }

  const projection = snapshotProjection(raw);
  if (!projection) return fixedResponse(request, 500, FIXED_BYTES.unavailable);
  if (projection.kind === 'page') {
    const bytes = context.pages.get(projection.key);
    return bytes
      ? fixedResponse(request, 200, bytes)
      : fixedResponse(request, 500, FIXED_BYTES.unavailable);
  }

  const location = admittedRedirectOrigin(projection.origin, context.origin);
  return location
    ? fixedResponse(request, 303, undefined, { location })
    : fixedResponse(request, 500, FIXED_BYTES.unavailable);
}

/** Emit a fixed Host-authority rejection under the complete response policy. */
export function misdirectedResponse(request: Request): Response {
  return fixedResponse(request, 421, FIXED_BYTES.misdirected);
}

/** Emit a fixed Fetch Metadata rejection under the complete response policy. */
export function forbiddenResponse(request: Request): Response {
  return fixedResponse(request, 403, FIXED_BYTES.forbidden);
}

function fixedResponse(
  request: Request,
  status: number,
  bytes?: Uint8Array<ArrayBuffer>,
  extraHeaders: Record<string, string> = {},
): Response {
  const headers = new Headers(POLICY_HEADERS);
  headers.set('content-type', CONTENT_TYPE);
  headers.set('content-length', String(bytes?.byteLength ?? 0));
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value);
  return new Response(request.method === 'HEAD' ? null : bytes, { status, headers });
}

function admittedRedirectOrigin(input: string, bootstrapOrigin: string): string | undefined {
  try {
    const url = new URL(input);
    if (url.protocol !== 'http:') return;
    if (url.hostname !== '127.0.0.1' && url.hostname !== '[::1]') return;
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return;
    const canonical = input === url.origin || input === `${url.origin}:80`;
    const bootstrap = new URL(bootstrapOrigin);
    if (!canonical || url.origin === bootstrap.origin) return;
    return input;
  } catch {
    return;
  }
}

function requestUrl(request: Request): URL | undefined {
  try {
    return new URL(request.url);
  } catch {
    return;
  }
}

function encode(input: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(input);
}
