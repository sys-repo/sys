import type {
  Hono,
  Context as HonoContext,
  MiddlewareHandler as HonoMiddlewareHandler,
  Schema as HonoSchema,
} from 'hono';
import type { cors } from 'hono/cors';
import type { BlankSchema as HonoBlankSchema, Env as HonoEnv } from 'hono/types';
import type { t } from './common.ts';

/**
 * HTTP Webserver.
 */
export type HttpServerLib = {
  readonly Hono: typeof Hono;
  readonly cors: typeof cors;
  readonly static: t.HttpServeStatic;
  create(options?: t.HttpServerCreateOptions): HonoApp;
  options(port?: number, pkg?: t.Pkg, hash?: t.StringHash): Deno.ServeOptions<Deno.NetAddr>;
  options(args: t.HttpServerOptionsOptions): Deno.ServeOptions<Deno.NetAddr>;
  print(args: t.HttpServerPrintOptions): void;
  keyboard(args: t.HttpServerKeyboardOptions): Promise<void>;
};

/** Arguments passed to [HttpServer.options] */
export type HttpServerOptionsOptions = {
  port?: number;
  pkg?: t.Pkg;
  hash?: t.StringHash;
};

/** Arguments passed to [HttpServer.print] */
export type HttpServerKeyboardOptions = {
  port: number;
  print?: boolean;
  dispose?: () => Promise<void>;
};

/** Arguments passed to [HttpServer.print] */
export type HttpServerPrintOptions = {
  addr: Deno.NetAddr;
  pkg?: t.Pkg;
  hash?: t.StringHash;
  keyboard?: boolean;
  requestedPort?: t.PortNumber;
};

/** Options passed to the creation of a server. */
export type HttpServerCreateOptions = {
  pkg?: t.Pkg;
  hash?: t.StringHash;
  cors?: boolean;
  static?: boolean | t.StringDir | [t.StringUrlRoute, t.StringDir];
};

/**
 * Create static file-server middleware.
 */
export type HttpServeStatic = (
  input: HttpServeStaticOptions | t.StringDir,
) => t.HonoMiddlewareHandler;

/** Options passed to the static server middleware. */
export type HttpServeStaticOptions<E extends HonoEnv = HonoEnv> = {
  root?: string;
  path?: string;
  precompressed?: boolean;
  mimes?: Record<string, string>;
  rewriteRequestPath?: (path: string) => string;
  onFound?: (path: string, c: HonoContext<E>) => void | Promise<void>;
  onNotFound?: (path: string, c: HonoContext<E>) => void | Promise<void>;
};

/**
 * Hono Server (application instnace).
 */
export type HonoApp = Hono<HonoEnv, HonoBlankSchema, '/'>;
export type { HonoBlankSchema, HonoContext, HonoEnv, HonoMiddlewareHandler, HonoSchema };

/**
 * Context passed into route handlers.
 */
export type RouteContext = {
  readonly app: t.HonoApp;
};
