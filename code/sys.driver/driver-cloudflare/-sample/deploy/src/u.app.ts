import { R2 } from '@sys/driver-cloudflare/r2';
import { HttpServer } from '@sys/http/server';
import type { t } from './common.ts';
import { artifactFrom, configFrom, routesFor } from './u.selection.ts';

/** Compose the UI read handler and JSON endpoint without opening a listener. */
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
  const app = HttpServer.create({ static: false, cors: false });
  app.all('*', async (c) => {
    const req = c.req.raw;
    const url = new URL(req.url);
    const path = url.pathname;
    c.header('Cache-Control', 'no-store');
    c.header('X-Content-Type-Options', 'nosniff');

    if (path !== '/ui' && path !== '/api/hello' && !path.startsWith('/ui/')) {
      return c.body(null, 404);
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      c.header('Allow', 'GET, HEAD');
      return c.body(null, 405);
    }
    if (path === '/ui') {
      if (url.search) return c.body(null, 400);
      return c.redirect('/ui/', 308);
    }
    if (path === '/api/hello') {
      const params = url.searchParams;
      const msg = params.get('msg') ?? 'hello';
      if (
        params.getAll('msg').length > 1 ||
        [...params.keys()].some((key) => key !== 'msg') ||
        msg.length > 128
      ) {
        return c.body(null, 400);
      }
      const response = c.json({ msg: `${msg} world!` });
      return req.method === 'HEAD' ? new Response(null, response) : response;
    }

    // Hono's default mount decodes aliases. Change only the literal parsed-URL mount instead.
    url.pathname = path.slice('/ui'.length);
    return await read(new Request(url, req));
  });
  return app;
}
