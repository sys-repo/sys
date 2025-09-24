import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { pkg, type t } from './common.ts';

/**
 * Minimal HTTP handler on the same port as websocket-server
 */
export function createHttpServer(args: { totalPeers: () => number }) {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const { method, url } = wrangle.req(req);

    // CORS:
    const setCors = () => {
      res.setHeader('access-control-allow-origin', '*');
      res.setHeader('access-control-allow-methods', 'GET,OPTIONS');
      res.setHeader('access-control-allow-headers', 'content-type, x-requested-with');
      // Optional: cache the preflight for a bit
      res.setHeader('access-control-max-age', '600');
    };

    // 1) Preflight:
    if (method === 'OPTIONS') {
      setCors();
      res.statusCode = 204;
      res.end();
      return;
    }

    // 2) JSON probe endpoints:
    const isRoot = Is.root(url, method);
    const isWellKnown = Is.wellKnown(url, method);

    if (isRoot || isWellKnown) {
      const payload: t.SyncServerInfo = {
        pkg,
        total: { peers: args.totalPeers() },
      };
      res.statusCode = 200;
      setCors();
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.setHeader('cache-control', 'no-store');
      res.end(JSON.stringify(payload, null, '  '));
      return;
    }

    // 3) Fallback: tiny 404:
    setCors();
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
  root(url: string, method: string) {
    return method === 'GET' && (url === '/' || url.startsWith('/?'));
  },
  wellKnown(url: string, method: string) {
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
