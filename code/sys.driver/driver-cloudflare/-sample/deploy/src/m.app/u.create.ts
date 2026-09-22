import { R2 } from '@sys/driver-cloudflare/r2';
import { HttpServer } from '@sys/http/server';
import { Pkg, type t } from './common.ts';
import { DIST_LIMITS, routesFor, selectionFiles, snapshotInputs } from './u.selection.ts';

/**
 * Admit the remote manifest before constructing any application route or API.
 */
export async function createApp(options: t.AppOptions): Promise<t.HttpServer.App> {
  const { config, selection } = snapshotInputs(options.config, options.selection);
  const target = config.targets.private;
  const source = options.bucket;
  const bucket = Object.freeze({
    name: source.name,
    presignGet: source.presignGet?.bind(source),
  });
  const signal = options.signal;
  if (bucket.name !== target.bucket) {
    throw new Error('Sample bucket does not match configuration.');
  }
  const storageOrigin = R2.Service.storageUrl(config.accountId);
  const bootstrap = R2.ReadRoute.create({
    bucket,
    storageOrigin,
    routes: { '/dist.json': `${target.prefix}/dist.json` },
    authorize: () => true,
    limits: {
      maxBytes: DIST_LIMITS.manifestBytes,
      timeout: config.limits.timeout,
      maxConcurrent: 1,
    },
  });
  const response = await bootstrap(new Request('https://sample.invalid/dist.json', { signal }));
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Sample manifest read refused: HTTP ${response.status}.`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const admitted = await Pkg.Dist.Pinned.admitManifest({
    bytes,
    integrity: selection.private['dist.json'],
    limits: DIST_LIMITS,
    until: signal,
  });
  if (admitted.kind !== 'manifest-admitted') {
    throw new Error(`Sample manifest refused: ${admitted.kind}.`);
  }
  const files = selectionFiles(admitted.evidence.dist);
  const read = R2.ReadRoute.create({
    bucket,
    storageOrigin,
    routes: routesFor(config, files),
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
  return c.json({ msg: '👋 hello world!' });
}
