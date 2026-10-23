import { type t } from './common.ts';
import { contentTypeFromPath } from '../u/u.contentTypeFromPath.ts';
import { argsSnapshot, readResult, requestSnapshot } from './u.serveFileBytes.input.ts';

const FAILURE_STATUS: Record<t.HttpServer.ServeFileBytes.Read.FailureKind, number> = {
  missing: 404,
  changed: 412,
  cancelled: 499,
  failure: 500,
};

/**
 * Emit one constrained response from lazily supplied bytes.
 */
export async function serveFileBytes(args: t.HttpServer.ServeFileBytes.Args): Promise<Response> {
  try {
    return await serve(args);
  } catch {
    return empty(500);
  }
}

/**
 * Helpers:
 */
async function serve(input: unknown): Promise<Response> {
  const args = argsSnapshot(input);
  if (!args) return empty(500);

  const request = requestSnapshot(args.req);
  if (!request) return empty(500);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return empty(405, { allow: 'GET, HEAD' });
  }
  if (request.hasRange) return empty(416);

  const path = args.path;
  const read = args.read;
  const result = readResult(await read());
  if (!result) return empty(500);
  if (result.kind !== 'bytes') return empty(FAILURE_STATUS[result.kind]);

  const bytes = copyBytes(result.bytes);
  if (!bytes) return empty(500);

  const headers = responseHeaders({
    'content-length': String(bytes.byteLength),
    'content-type': contentTypeFromPath(path),
  });
  const body = request.method === 'HEAD' ? null : bytes;
  return new Response(body, { status: 200, headers });
}

function copyBytes(input: Uint8Array): Uint8Array<ArrayBuffer> | undefined {
  return Uint8Array.from(input);
}

function empty(status: number, extra?: HeadersInit): Response {
  return new Response(null, { status, headers: responseHeaders(extra) });
}

function responseHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  return headers;
}
