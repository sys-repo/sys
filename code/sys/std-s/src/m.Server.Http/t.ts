import type { t } from './common.ts';

import type {
  Hono,
  Context as HonoContext,
  MiddlewareHandler as HonoMiddlewareHandler,
  Schema as HonoSchema,
} from '@hono/hono';
import type { cors } from '@hono/hono/cors';
import type { serveStatic } from '@hono/hono/deno';
import type { BlankSchema as HonoBlankSchema, Env as HonoEnv } from '@hono/hono/types';

/**
 * Webserver.
 */
export type HttpServerLib = {
  readonly Auth: t.ServerAuth;
  readonly Hono: typeof Hono;
  readonly cors: typeof cors;
  readonly static: typeof serveStatic;
  create(options?: HttpServerCreateOptions): HonoApp;
  options(port?: number, pkg?: t.Pkg): Deno.ServeOptions;
  print(addr: Deno.NetAddr, pkg?: t.Pkg): void;
};

export type HttpServerCreateOptions = {
  cors?: boolean;
  static?: boolean;
};

/**
 * Hono Server (application instnace).
 */
export type HonoApp = Hono<HonoEnv, HonoBlankSchema, '/'>;
export type { HonoBlankSchema, HonoContext, HonoEnv, HonoMiddlewareHandler, HonoSchema };

/**
 * Route
 */
export type RouteContext = {
  readonly app: t.HonoApp;
  readonly auth: t.AuthCtx;
};
