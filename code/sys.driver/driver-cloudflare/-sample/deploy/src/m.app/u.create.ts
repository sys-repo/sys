import { R2 } from '@sys/driver-cloudflare/r2';
import { HttpServer } from '@sys/http/server';
import type { t } from './common.ts';
import { artifactFrom, configFrom, routesFor } from './u.selection.ts';

/**
 * Compose the UI read handler and JSON endpoint without opening a listener.
 */
export function createApp(options: t.AppOptions): t.HttpServer.App {
  const config = configFrom(options.config);
  const artifact = artifactFrom(options.artifact);
  if (options.bucket.name !== config.bucket) {
    throw new Error('Sample bucket does not match configuration.');
  }

  const read = R2.ReadRoute.create({
    bucket: options.bucket,
    storageOrigin: R2.Service.storageUrl(config.accountId),
    routes: routesFor(config, artifact),
    authorize: () => true,
    limits: config.limits,
  });

  // Keep routing and mount stripping literal; Hono's default path reader decodes aliases.
  const app = new HttpServer.Hono({ getPath: (req) => new URL(req.url).pathname });
  app.use(responseHeaders);
  app.all('/', readOnly, redirectUi);
  app.all('/ui', readOnly, redirectUi);
  app.all('/api/hello', readOnly, hello);
  app.all('/ui/*', readOnly);
  app.mount('/ui', read);
  app.notFound((c) => c.body(null, 404));
  return app;
}

/**
 * Helpers:
 */
const responseHeaders: t.HttpServer.Hono.MiddlewareHandler = async (c, next) => {
  await next();
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
};

const readOnly: t.HttpServer.Hono.MiddlewareHandler = async (c, next) => {
  const method = c.req.method;
  if (method !== 'GET' && method !== 'HEAD') {
    c.header('Allow', 'GET, HEAD');
    return c.body(null, 405);
  }
  await next();
};

function redirectUi(c: t.HttpServer.Hono.Context) {
  if (new URL(c.req.url).search) return c.body(null, 400);
  return c.redirect('/ui/', 308);
}

function hello(c: t.HttpServer.Hono.Context) {
  return c.json({ msg: 'hello world!' });
}
