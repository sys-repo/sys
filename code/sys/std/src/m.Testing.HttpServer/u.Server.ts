import type { t } from '../common/mod.ts';
import { HttpUrl } from '../m.Http/u.Http.Url.ts';

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

    const server = Deno.serve({ port: 0 }, (req, info) => {
      const list = Array.from(handlers).filter((item) => item.method === req.method);
      if (list.length > 0) return list[0].handler(req, info);
      if (defaultHandler) return defaultHandler(req, info);
      return new Response('404 Not Found', { status: 404 });
    });

    const addr = server.addr;
    const url = HttpUrl.fromAddr(addr);

    const api: t.TestHttpServerInstance = {
      addr,
      url,
      get disposed() {
        return _disposed;
      },
      async dispose() {
        _disposed = true;
        await server.shutdown();
      },
    };

    return api;
  },
};
