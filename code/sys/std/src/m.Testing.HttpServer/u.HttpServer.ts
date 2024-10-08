import type { t } from '../common.ts';
import { TestServer } from './u.Server.ts';

/**
 * HTTP test helpers.
 */
export const TestHttpServer: t.TestHttpServer = {
  /**
   * Factory: create and start an HTTP test server.
   */
  server: TestServer.create,

  /**
   * Retrieve JSON response.
   */
  json(...args: any[]) {
    const req = args.length === 2 ? args[0] : undefined;
    const body = args.length === 2 ? args[1] : args[0];
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (req?.url) headers['X-Request-URL'] = req?.url;
    return new Response(JSON.stringify(body), { headers });
  },
} as const;
