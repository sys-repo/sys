import { D, Fs, HttpServer, Path, pkg, type t } from '../common.ts';
import { loadConfig } from '../u.config/u.doc.ts';
import { Config } from './m.Config.ts';
import { Mount } from './m.Mount.ts';
import { Root } from './m.Root.ts';
import { HttpProxyResolver } from './m.Resolver.ts';

/**
 * HTTP proxy helpers for route resolution, config loading, and server startup.
 */
export const HttpProxy: t.HttpProxy.Lib = Object.freeze({
  Config,
  Root,
  Mount,

  create(options = {}) {
    const resolver = HttpProxyResolver(wrangle.config(options));
    const app = HttpServer.create({ pkg, static: false, cors: false });

    app.all('*', async (c) => {
      const request = c.req.raw;
      const { pathname, search } = new URL(request.url);
      const route = resolver(pathname, request.method);

      if (route.kind === 'none') return c.notFound();
      if (route.kind === 'redirect') return c.redirect(`${route.location}${search}`, 308);
      if (route.kind === 'method-not-allowed') {
        return c.text('Method Not Allowed', 405, { allow: route.allow });
      }

      const upstream = `${route.upstream}${search}`;
      try {
        const headers = wrangle.headers(request.headers);
        if (route.kind === 'root' && route.stripAuthorization) headers.delete('authorization');
        const response = await fetch(wrangle.request(request, upstream, headers));
        if (route.kind === 'exact') return response;

        const context = { request, pathname, upstream, routeKind: route.kind };
        const transformed = await applyResponseTransform(response, context, route.response);
        return applyResponseHeaders(transformed, route.response?.headers);
      } catch {
        return c.text('Bad Gateway', 502);
      }
    });

    return app;
  },

  async start(input = {}) {
    const args = await wrangle.startArgs(input);
    const app = HttpProxy.create(args);
    const config = wrangle.config(args);
    return HttpServer.start(app, {
      hostname: args.hostname as t.StringHostname | undefined,
      port: (args.port ?? D.port) as t.PortNumber,
      strictPort: args.strictPort,
      pkg,
      name: args.name,
      status: {
        kind: 'proxy',
        config: wrangle.configPathOrUndefined(args),
        urlPaths: wrangle.urlPaths(config),
        details: wrangle.details(args.info),
      },
      silent: args.silent,
      keyboard: args.keyboard,
      until: args.until,
    });
  },
});

/**
 * Helpers:
 */

function applyResponseHeaders(response: Response, headers?: HeadersInit): Response {
  if (!headers) return response;

  const nextHeaders = new Headers(response.headers);
  new Headers(headers).forEach((value, key) => nextHeaders.set(key, value));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: nextHeaders,
  });
}

async function applyResponseTransform(
  response: Response,
  context: t.HttpProxy.Response.TransformContext,
  config?: t.HttpProxy.Response.Config,
): Promise<Response> {
  if (!config?.transform) return response;
  const transformed = await config.transform(response, context);
  // A transformed body invalidates inherited content-length; strip it so runtime framing remains truthful.
  return removeContentLengthHeader(transformed);
}

function removeContentLengthHeader(response: Response): Response {
  if (!response.headers.has('content-length')) return response;

  const headers = new Headers(response.headers);
  headers.delete('content-length');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const BODYLESS_METHODS = new Set(['GET', 'HEAD']);
const FORWARDED_HEADER_DENYLIST = [
  'connection',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

const wrangle = {
  async startArgs(args: t.HttpProxy.StartArgs): Promise<t.HttpProxy.StartArgs> {
    const config = args.paths?.config;
    if (!config) return args;

    const doc = await loadConfig(wrangle.configPath(args), 'HttpProxy.start');
    return {
      ...doc,
      ...args,
      port: args.port ?? doc.port,
      strictPort: args.strictPort ?? doc.strictPort,
    };
  },

  configPath(args: t.HttpProxy.StartArgs): t.StringPath {
    const path = args.paths?.config;
    if (!path) throw new Error('HttpProxy.start: missing config path.');
    if (Path.Is.absolute(path)) return Path.normalize(path) as t.StringPath;
    const cwd = args.cwd ? Fs.resolve(args.cwd) : Fs.cwd('process');
    return Path.resolve(cwd, path) as t.StringPath;
  },

  configPathOrUndefined(args: t.HttpProxy.StartArgs): t.StringPath | undefined {
    return args.paths?.config ? wrangle.configPath(args) : undefined;
  },

  config(options: t.HttpProxy.CreateOptions): t.HttpProxy.Routing.Config {
    const { config, root, mounts, exactRoutes } = options;
    if (config && (root || mounts || exactRoutes !== undefined)) {
      const msg = 'HttpProxy: use either config or lifecycle root/mounts/exactRoutes, not both';
      throw new Error(msg);
    }
    if (config) return config;

    return {
      root: root
        ? { upstream: root.target, stripAuthorization: root.stripAuthorization }
        : undefined,
      mounts: mounts?.map((mount) => ({ mountPath: mount.path, upstream: mount.target })),
      exactRoutes,
    };
  },

  request(source: Request, upstream: t.StringUrl, headers: Headers): Request {
    const method = source.method.toUpperCase();
    const init: RequestInit = { method: source.method, headers, redirect: 'manual' };

    if (!BODYLESS_METHODS.has(method) && source.body) {
      init.body = source.body;
      (init as RequestInit & { duplex?: 'half' }).duplex = 'half';
    }

    return new Request(upstream, init);
  },

  headers(source: Headers): Headers {
    const headers = new Headers(source);
    const connectionHeaders = headers.get('connection')?.split(',').map((value) => value.trim()) ??
      [];

    [...FORWARDED_HEADER_DENYLIST, ...connectionHeaders]
      .filter(Boolean)
      .forEach((header) => headers.delete(header));

    return headers;
  },

  urlPaths(config: t.HttpProxy.Routing.Config): readonly t.HttpServer.Status.UrlPath[] {
    const paths: t.HttpServer.Status.UrlPath[] = [];
    if (config.root) paths.push({ label: 'root', path: '/' as t.StringUrlRoute });
    for (const mount of config.mounts ?? []) {
      paths.push({ label: wrangle.infoLabel(mount.mountPath), path: mount.mountPath });
    }
    for (const { method, path } of config.exactRoutes ?? []) {
      paths.push({ label: method, path });
    }
    return paths.length > 0 ? paths : ['/'] as const;
  },

  details(info: Record<string, string> | undefined): readonly t.Service.Detail[] {
    return Object.entries(info ?? {}).map(([label, value]) => ({ label, value }));
  },

  infoLabel(path: string): string {
    const label = path.replace(/^\/+|\/+$/g, '').replace(/\//g, '.');
    return label ? `route.${label}` : 'root';
  },
} as const;
