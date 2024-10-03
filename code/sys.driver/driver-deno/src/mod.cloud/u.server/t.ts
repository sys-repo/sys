import type { RouteContext as RouteContextBase } from '@sys/std-s/types';
import type { t } from './common.ts';

type PortNumber = number;
type DenoHttpServer = Deno.HttpServer<Deno.NetAddr>;

/**
 * Map of the environment variables retrieved from the process ENV variables or a [.env] file.
 */
export type EnvVars = {
  deno: { accessToken: string; orgId: string };
  privy: { appId: string; appSecret: string };
};

/**
 * Context passed to routes.
 */
export type RouteContext = RouteContextBase & { env: EnvVars };

/**
 * Library: Server for working with the Deno cloud.
 */
export type DenoCloudServerLib = {
  env(): Promise<t.EnvVars>;
  client: t.DenoCloudClientLib['client'];
  server(args: t.DenoCloudServerArgs): t.HonoApp;
  serve(options?: t.DenoCloudServeOptions): Promise<DenoHttpServer>;
  serve(port?: PortNumber, pkg?: t.Pkg): Promise<DenoHttpServer>;
};

/**
 * Arguments passed to the HTTP server at startup.
 */
export type DenoCloudServerArgs = {
  env: EnvVars;
  authEnabled?: boolean;
  authLogger?: t.AuthLogger;
};

/**
 * Options passed to simple HTTP "serve" method.
 */
export type DenoCloudServeOptions = {
  port?: number;
  Pkg?: t.Pkg;
  env?: t.EnvVars;
};

/**
 * Library: Auth.
 */
export type AuthLib = {
  /**
   * Initialize the auth middleware.
   */
  middleware(ctx: t.RouteContext, options?: t.AuthMiddlewareOptions): t.AuthMiddleware;
};

/**
 * Middleware that manages authentication on the service.
 */
export type AuthMiddleware = t.HonoMiddlewareHandler<t.HonoEnv, '*'>;

/**
 * Options passed to the auth middleware.
 */
export type AuthMiddlewareOptions = {
  enabled?: boolean;
  logger?: t.AuthLogger;
};

/**
 * A logger callback that write events to a log.
 */
export type AuthLogger = (e: AuthLogEntry) => void;

/**
 * A single auth entry submitted to a log.
 */
export type AuthLogEntry = {
  status: 'OK' | 'Skipped:Disabled' | 'Skipped:Allowed';
  path: string;
};
