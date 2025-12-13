import type { t } from '../common.ts';
import { Url } from '../m.Url/mod.ts';

type M = 'GET' | 'PUT' | 'POST' | 'DELETE';
type H = { method: M; handler: Deno.ServeHandler };

/**
 * HTTP test server
 */
export const TestServer = {
  /**
   * Create and start a new HTTP test server.
   */
  create(defaultHandler?: Deno.ServeHandler): t.TestHttpServerInstance {
    let _disposed = false;
    const handlers = new Set<H>();

    // Bind to loopback so `server.url` is always a client-routable address in CI.
    // The wildcard listen address ("0.0.0.0") is not a safe fetch() target.
    const server = Deno.serve({ hostname: '127.0.0.1', port: 0 }, (req, info) => {
      const list = Array.from(handlers).filter((item) => item.method === req.method);
      if (list.length > 0) return list[0].handler(req, info);
      if (defaultHandler) return defaultHandler(req, info);
      return new Response('404 Not Found', { status: 404 });
    });

    const addr = server.addr;
    const url = Url.parse(addr);

    const api: t.TestHttpServerInstance = {
      addr,
      url,
      get disposed() {
        return _disposed;
      },

      async dispose() {
        if (_disposed) return;
        _disposed = true;
        try {
          await server.shutdown();
        } finally {
          handlers.clear();
        }
      },
    };

    return api;
  },
};
