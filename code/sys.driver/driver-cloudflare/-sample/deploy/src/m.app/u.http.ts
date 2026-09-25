import { Hono } from 'hono';
import type { t } from './common.ts';

/**
 * Construct HTTP routes around an already-admitted shell handler.
 */
export function createApp({ shell }: t.AppOptions): t.HttpServer.App {
  // Do not decode percent-encoded paths before routing or stripping the mount prefix.
  const app = new Hono({ getPath: (req) => new URL(req.url).pathname });
  app.use(responseHeaders);
  app.all('/', readOnly, redirectUi);
  app.all('/ui', readOnly, redirectUi);
  app.all('/api/hello', readOnly, hello);
  app.all('/ui/*', readOnly);
  app.mount('/ui', shell);
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
  return c.json({ msg: '👋 hello world!' });
}
