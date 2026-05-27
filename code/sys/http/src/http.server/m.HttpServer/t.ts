import type {
  Context as THonoContext,
  Hono,
  MiddlewareHandler as THonoMiddlewareHandler,
  Schema as THonoSchema,
} from 'hono';
import type { cors } from 'hono/cors';
import type { BlankSchema as THonoBlankSchema, Env as THonoEnv } from 'hono/types';
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
  name?: string;
  info?: Record<string, string>;
  silent?: boolean;
  dir?: string;
  status?: HttpServerStatusOptions;
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
  name?: string;
  info?: Record<string, string>;
  silent?: boolean;
  dir?: t.StringDir;

  /** Structured, renderer-neutral status metadata for the running server handle. */
  status?: HttpServerStatusOptions;

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

  /** Renderer-neutral service status snapshot. */
  status(): t.Service.Status;

  /** HTTP/domain alias for `dispose()`. */
  close(reason?: unknown): Promise<void>;
};

/** Structured status metadata passed to [HttpServer.start]. */
export type HttpServerStatusOptions = {
  /** Owner-local kind, e.g. `http`, `static`, or `proxy`. */
  readonly kind?: string;

  /** Owner config path, if the server was started from one. */
  readonly config?: t.StringPath;

  /** Primary served filesystem root, if the server has one. Defaults to `dir`. */
  readonly root?: t.StringDir;

  /** URL paths to resolve against the server origin. Defaults to `/`. */
  readonly urlPaths?: readonly HttpServerStatusUrlPath[];

  /** Extra owner facts that are not URLs and not lifecycle control. */
  readonly details?: readonly t.Service.Detail[];
};

export type HttpServerStatusUrlPath =
  | t.StringUrlRoute
  | { readonly path: t.StringUrlRoute; readonly label?: string };

/** Arguments passed to [HttpServer.print]. */
export type HttpServerPrintOptions = {
  addr: Deno.NetAddr;
  pkg?: t.Pkg;
  hash?: t.StringHash;
  name?: string;
  info?: Record<string, string>;
  requestedPort?: t.PortNumber;
  dir?: t.StringDir;
  status?: HttpServerStatusOptions;
  keyboard?: HttpServerPrintKeyboardOptions;
};

/** Keyboard affordances rendered in HTTP startup output. */
export type HttpServerPrintKeyboardOptions = {
  /** Key used to open the primary URL in a browser. */
  readonly open?: string;

  /** Keys used to stop the server. */
  readonly quit?: string;
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
export type HttpServeStaticOptions<E extends THonoEnv = THonoEnv> = {
  root?: string;
  path?: string;
  precompressed?: boolean;
  mimes?: Record<string, string>;
  rewriteRequestPath?: (path: string) => string;
  onFound?: (path: string, c: THonoContext<E>) => void | Promise<void>;
  onNotFound?: (path: string, c: THonoContext<E>) => void | Promise<void>;
};

/**
 * Hono Server (application instnace).
 */
export type HonoApp = Hono<THonoEnv, THonoBlankSchema, '/'>;
export type HonoBlankSchema = THonoBlankSchema;
export type HonoContext = THonoContext;
export type HonoEnv = THonoEnv;
export type HonoMiddlewareHandler = THonoMiddlewareHandler;
export type HonoSchema = THonoSchema;

/**
 * Context passed into route handlers.
 */
export type RouteContext = {
  readonly app: t.HonoApp;
};
