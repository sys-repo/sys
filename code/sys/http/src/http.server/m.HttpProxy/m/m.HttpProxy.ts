import { D, Fs, HttpServer, Path, pkg, type t } from '../common.ts';
import { loadConfig } from '../u.config/u.doc.ts';
import { Config } from './m.Config.ts';
import { Mount } from './m.Mount.ts';
import { Root } from './m.Root.ts';
import { HttpProxyResolver } from './m.Resolver.ts';

/** HTTP proxy helpers for route resolution, config loading, and server startup. */
export const HttpProxy: t.HttpProxy.Lib = {
  Config,
  Root,
  Mount,

  create(options = {}) {
    const resolver = HttpProxyResolver(wrangle.config(options));
    const app = HttpServer.create({ pkg, static: false, cors: false });

    app.all('*', async (c) => {
      const url = new URL(c.req.raw.url);
      const pathname = url.pathname as t.StringUrlRoute;
      const result = resolver(pathname);

      if (result.kind === 'redirect') {
        return c.redirect(`${result.location}${url.search}`, 308);
      }

      if (result.kind === 'none') {
        return c.notFound();
      }

      const upstream = `${result.upstream}${url.search}`;

      try {
        const request = wrangle.request(c.req.raw, upstream as t.StringUrl);
        const response = await fetch(request);
        const transformed = await applyResponseTransform(response, {
          request: c.req.raw,
          pathname,
          upstream: upstream as t.StringUrl,
          routeKind: result.kind,
        }, result.response);
        return applyResponseHeaders(transformed, result.response?.headers);
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
};

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
    return { ...doc, ...args };
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
    if (options.config && (options.root || options.mounts)) {
      throw new Error('HttpProxy: use either config or lifecycle root/mounts, not both');
    }

    if (options.root || options.mounts) {
      return {
        root: options.root ? { upstream: options.root.target } : undefined,
        mounts: options.mounts?.map((mount) => ({
          mountPath: mount.path,
          upstream: mount.target,
        })),
      } satisfies t.HttpProxy.Routing.Config;
    }

    return options.config ?? {};
  },

  request(source: Request, upstream: t.StringUrl): Request {
    const method = source.method.toUpperCase();
    const headers = wrangle.headers(source.headers);
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
