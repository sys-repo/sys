import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { pkg, Pkg } from './common.ts';

/**
 * Minimal HTTP handler on the same port as websocket-server
 */
export function createHttpServer() {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    // JSON probe endpoints:
    const isRoot = Is.root(req);
    const isWellKnown = Is.wellKnown(req);

    if (isRoot || isWellKnown) {
      const body = JSON.stringify({ module: Pkg.toString(pkg) });
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      // Allow simple browser fetches and expose nothing sensitive:
      res.setHeader('access-control-allow-origin', '*');
      res.end(body);
      return;
    }

    // Fallback: tiny 404 for other HTTP paths.
    res.statusCode = 404;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Not Found');
  });
}

/**
 * Dispose of an HTTP server instance.
 */
export function disposeHttpServer(http: Server) {
  return new Promise<void>((resolve) => {
    try {
      http.close(() => resolve());
    } catch {
      resolve();
    }
  });
}

/**
 * Helpers:
 */
const Is = {
  root(req: IncomingMessage) {
    const { url, method } = wrangle.req(req);
    return method === 'GET' && (url === '/' || url.startsWith('/?'));
  },

  wellKnown(req: IncomingMessage) {
    const { url, method } = wrangle.req(req);
    return (
      method === 'GET' &&
      (url === '/.well-known/sync-handshake' || url.startsWith('/.well-known/sync-handshake?'))
    );
  },
} as const;

const wrangle = {
  req(msg: IncomingMessage) {
    const method = msg.method ?? 'GET';
    const url = msg.url ?? '/';
    return { method, url } as const;
  },
} as const;
