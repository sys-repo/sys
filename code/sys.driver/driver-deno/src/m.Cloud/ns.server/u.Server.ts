import { type t, HttpServer } from './common.ts';
import { Auth } from './u.Auth.ts';
import { Routes } from './u.Routes.ts';

type A = t.DenoCloudServerArgs;

/**
 * Initialize a new HTTP server.
 */
export function server(args: A) {
  const { env, pkg, hash } = args;
  const app = HttpServer.create({ pkg, hash });
  // const auth = wrangle.auth(args);
  const ctx: t.RouteContext = { app, env, pkg };

  // Configure HTTP server.
  app.use('*', wrangle.authMiddleware(args, ctx));
  Routes.root(ctx);
  Routes.subhosting('/subhosting', ctx);

  // Finish up.
  return app;
}

/**
 * Helpers
 */
const wrangle = {
  authMiddleware(args: A, ctx: t.RouteContext) {
    const enabled = args.authEnabled ?? true;
    const logger = args.authLogger;
    return Auth.middleware(ctx, { enabled, logger });
  },
} as const;
