import type {
  Context as HonoContext,
  Hono,
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
  forceDirSlash(root: string, strip?: string): t.HonoMiddlewareHandler;
  create(options?: t.HttpServerCreateOptions): HonoApp;
  start(app: t.HonoApp, options?: t.HttpServerStartOptions): t.HttpServerStarted;
  options(args?: t.HttpServerOptionsOptions): Deno.ServeOptions<Deno.NetAddr>;
  print(args: t.HttpServerPrintOptions): void;
  keyboard(args: t.HttpServerKeyboardOptions): Promise<void>;
};

/** Arguments passed to [HttpServer.options] */
export type HttpServerOptionsOptions = {
  port?: number;
  pkg?: t.Pkg;
  hash?: t.StringHash;
  silent?: boolean;
  dir?: string;
};

/** Arguments passed to [HttpServer.keyboard]. */
export type HttpServerKeyboardOptions = {
  port: number;
  url?: string;
  print?: boolean;
  exit?: boolean;
  dispose?: () => Promise<void>;
};

/** Arguments passed to [HttpServer.start]. */
export type HttpServerStartOptions = {
  port?: t.PortNumber;
  hostname?: t.StringHostname;
  pkg?: t.Pkg;
  hash?: t.StringHash;
  silent?: boolean;
  dir?: t.StringDir;

  /** External platform cancellation bridge. */
  signal?: AbortSignal;

  /** Canonical @sys lifecycle bridge. */
  until?: t.UntilInput;

  keyboard?: boolean | HttpServerStartKeyboardOptions;
};

/** Keyboard behavior for [HttpServer.start]. */
export type HttpServerStartKeyboardOptions = {
  print?: boolean;

  /**
   * Exit the process when keyboard quit is received.
   *
   * Defaults to false. Server shutdown is the primitive behavior;
   * process exit must be explicit.
   */
  exit?: boolean;
};

/** Running server returned by [HttpServer.start]. */
export type HttpServerStarted = t.LifecycleAsync & {
  readonly app: t.HonoApp;
  readonly server: Deno.HttpServer<Deno.NetAddr>;
  readonly addr: Deno.NetAddr;
  readonly hostname: t.StringHostname;
  readonly port: t.PortNumber;

  /** Local browser-safe HTTP origin, e.g. `http://localhost:8080`. */
  readonly origin: t.StringUrl;

  /** Server lifecycle signal; aborted when this context is disposed or closed. */
  readonly signal: AbortSignal;

  /** Resolves when the underlying Deno server has finished. */
  readonly finished: Promise<void>;

  /** HTTP/domain alias for `dispose()`. */
  close(reason?: unknown): Promise<void>;
};

/** Arguments passed to [HttpServer.print] */
export type HttpServerPrintOptions = {
  addr: Deno.NetAddr;
  pkg?: t.Pkg;
  hash?: t.StringHash;
  keyboard?: boolean;
  requestedPort?: t.PortNumber;
  dir?: t.StringDir;
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
