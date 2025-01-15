import type { t } from '../common/mod.ts';

/**
 * Library: HTTP testing helpers.
 */
export type TestingHttpLib = t.TestingLib & {
  /** Helpers for working with an HTTP server. */
  readonly Http: t.TestHttpServer;
};

/** An simple HTTP server for testing. */
export type TestHttpServer = {
  /** Generate a new HTTP testing server. */
  server(defaultHandler?: Deno.ServeHandler): t.TestHttpServerInstance;

  /** Convert the given JSON value to a Response object. */
  json(body: unknown): Response;
  json(req: Request, body: unknown): Response;

  /** Convert the given text value to a Response object. */
  text(body: unknown): Response;
  text(req: Request, body: unknown): Response;

  /** Produce an error response */
  error(status: number, statusText: string): Response;
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
