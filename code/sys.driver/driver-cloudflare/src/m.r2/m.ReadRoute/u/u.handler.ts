import { serveFileBytes, type t } from '../common.ts';
import type { RouteConfig, RouteOperation } from '../t.internal.ts';
import { isRoutePath } from './u.input.ts';
import { createOperation } from './u.operation.ts';
import { readObject } from './u.read.ts';

/** Construct a handler using the captured signer and a privately copied route map. */
export function createHandler(config: RouteConfig): t.R2.ReadRoute.Handler {
  let active = 0;

  return async (req) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return empty(405, { allow: 'GET, HEAD' });
    if (req.headers.has('range')) return empty(416);
    const url = new URL(req.url);
    if (url.search || url.hash || !isRoutePath(url.pathname)) return empty(400);
    const key = config.routes.get(url.pathname);
    if (key === undefined) return empty(404);
    if (req.signal.aborted) return empty(499);
    if (active >= config.limits.maxConcurrent) return empty(503);

    active++;
    const operation = createOperation(req.signal, config.limits.timeout);
    const work = async () => {
      try {
        return await serve(config, req, key, operation);
      } catch {
        return empty(operation.status ?? 502);
      } finally {
        operation.dispose();
        active--;
      }
    };
    const stopped = async () => empty(await operation.stopped);
    // Only the worker releases capacity. A caller-facing deadline does not end storage work.
    return await Promise.race([work(), stopped()]);
  };
}

/**
 * Helpers:
 */
async function serve(
  config: RouteConfig,
  req: Request,
  key: string,
  operation: RouteOperation,
): Promise<Response> {
  operation.check();
  let allowed: boolean;
  try {
    allowed = await config.authorize({ req, key, signal: operation.signal });
  } catch {
    operation.check();
    return empty(500);
  }
  operation.check();
  if (allowed !== true) return empty(403);

  const result = await readObject(config, key, operation);
  operation.check();
  if ('status' in result) return empty(result.status);
  const response = await serveFileBytes({
    req,
    path: key,
    cache: 'no-store',
    read: () => Promise.resolve({ kind: 'bytes', bytes: result.bytes }),
  });
  operation.check();
  return response;
}

function empty(status: number, extra?: HeadersInit): Response {
  const headers = new Headers(extra);
  headers.set('cache-control', 'no-store');
  headers.set('x-content-type-options', 'nosniff');
  return new Response(null, { status, headers });
}
