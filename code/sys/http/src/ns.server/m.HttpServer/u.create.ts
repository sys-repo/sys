import { Hono, cors, type t } from './common.ts';
import { serveStatic } from './u.serveStatic.ts';

type Optionsions = t.HttpServerCreateOptions;

/**
 * Create a new Hono application instance with cors and /static file server.
 */
export function create(options: Optionsions = {}) {
  const { pkg, hash } = options;
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
      if (hash) c.header('pkg-digest', encodeURIComponent(hash));
    });
  }

  if (options.static ?? true) {
    const { route, root } = wrangle.static(options.static);
    app.use(route, serveStatic({ root }));
  }

  return app;
}

/**
 * Helpers
 */
const wrangle = {
  static(input: Optionsions['static']) {
    let route = '/static/*';
    let root = './';
    if (typeof input === 'string') root = input;
    if (Array.isArray(input)) {
      route = input[0];
      root = input[1];
    }
    return { route, root };
  },
} as const;
