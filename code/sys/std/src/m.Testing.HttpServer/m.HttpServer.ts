import type { t } from '../common.ts';
import { TestServer } from './m.Server.ts';

/**
 * HTTP test helpers.
 */
export const TestHttpServer: t.TestHttpServer = {
  server: TestServer.create,

  json(...args: any[]) {
    const { body, headers } = wrangle.args(args, 'application/json');
    const json = `${JSON.stringify(body, null, '  ')}\n`;
    return new Response(json, { headers });
  },

  text(...args: any[]) {
    const { body, headers } = wrangle.args(args, 'plain/text');
    return new Response(String(body), { headers });
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  args(args: any[], contentType: string): { req?: Request; body: unknown; headers: HeadersInit } {
    const req = args.length === 2 ? args[0] : undefined;
    const body = args.length === 2 ? args[1] : args[0];
    const headers: HeadersInit = { 'Content-Type': contentType };
    if (req?.url) headers['X-Request-URL'] = req?.url;
    return { req, body, headers };
  },
} as const;
