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
    const errors: unknown[] = [];

    // Bind to loopback so `server.url` is always a client-routable address in CI.
    // The wildcard listen address ("0.0.0.0") is not a safe fetch() target.
    const server = Deno.serve({ hostname: '127.0.0.1', port: 0 }, async (req, info) => {
      try {
        const list = Array.from(handlers).filter((item) => item.method === req.method);
        if (list.length > 0) return await list[0].handler(req, info);
        if (defaultHandler) return await defaultHandler(req, info);
        return new Response('404 Not Found', { status: 404 });
      } catch (error) {
        errors.push(error);
        return new Response('500 Test Server Handler Error', { status: 500 });
      }
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
          if (errors.length > 0) {
            throw wrangle.handlerError(errors);
          }
        } finally {
          handlers.clear();
          errors.length = 0;
        }
      },
    };

    return api;
  },
};

const wrangle = {
  handlerError(errors: unknown[]) {
    const first = errors[0];
    const msg = (err: string) => `Test HTTP server handler error: ${err}`;
    if (first instanceof Error) return new Error(msg(first.message), { cause: first });
    return new Error(msg(String(first)));
  },
} as const;
