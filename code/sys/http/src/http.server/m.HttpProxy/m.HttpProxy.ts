import { D, HttpServer, pkg, type t } from './common.ts';
import { HttpProxyResolver } from './m.Resolver.ts';

export const HttpProxy: t.HttpProxy.Lib = {
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

  async start(args = {}) {
    const app = HttpProxy.create(args);
    return HttpServer.start(app, {
      hostname: args.hostname as t.StringHostname | undefined,
      port: (args.port ?? D.port) as t.PortNumber,
      pkg,
      name: args.name,
      info: args.info,
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
  context: t.HttpProxy.ResponseTransformContext,
  config?: t.HttpProxy.ResponseConfig,
): Promise<Response> {
  if (!config?.transform) return response;
  return await config.transform(response, context);
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
  config(options: t.HttpProxy.CreateOptions): t.HttpProxy.Config {
    if (options.config && options.mounts) {
      throw new Error('HttpProxy: use either config or mounts, not both');
    }

    if (options.mounts) {
      return {
        mounts: options.mounts.map((mount) => ({
          mountPath: mount.path,
          upstream: mount.target,
          response: mount.response,
        })),
      } satisfies t.HttpProxy.Config;
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
} as const;
