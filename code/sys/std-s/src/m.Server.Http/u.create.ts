import { Hono, cors, serveStatic, type t } from './common.ts';

/**
 * Create a new Hono application instance with cors and /static file server.
 */
export function create(options: t.HttpServerCreateOptions = {}) {
  const { pkg } = options;
  const app = new Hono();

  if (options.cors ?? true) {
    app.use(
      '*',
      cors({
        origin: '*', // Allowed origin or use '*' to allow all origins.
        allowMethods: ['GET', 'POST'],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: 86400, // Preflight cache age in seconds.
      }),
    );
  }

  if (pkg) {
    app.use('*', async (c, next) => {
      await next(); // Proceed to the next middleware or route handler.

      // Once the response is prepared assign the "pkg" header.
      if (pkg?.name && pkg?.version) c.header('pkg', `${pkg.name}@${pkg.version}`);
    });
  }

  if (options.static ?? true) {
    app.use('/static/*', serveStatic({ root: './' }));
  }

  return app;
}
