import type { t } from '../common/mod.ts';

export type TestingHttp = t.Testing & {
  readonly HttpServer: t.TestHttpServer;
};

export type TestHttpServer = {
  server(defaultHandler?: Deno.ServeHandler): t.TestHttpServerInstance;
  json(body: unknown): Response;
  json(req: Request, body: unknown): Response;
};

/**
 * A test HTTP server.
 */
export type TestHttpServerInstance = {
  readonly url: t.HttpUrl;
  readonly addr: Deno.NetAddr;
  readonly disposed: boolean;
  dispose(): Promise<void>;
};
