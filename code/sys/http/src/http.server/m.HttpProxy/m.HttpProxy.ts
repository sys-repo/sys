import { D, Http, HttpServer, pkg, type t } from './common.ts';
import { HttpProxyResolver } from './m.Resolver.ts';

export const HttpProxy: t.HttpProxy.Lib = {
  create(options = {}) {
    const resolver = HttpProxyResolver(options.config ?? {});
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
        const response = await fetch(new Request(upstream, c.req.raw));
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

  async start(options = {}) {
    const port = options.port ?? D.port;
    const app = HttpProxy.create(options);
    const serverOptions = HttpServer.options({ port, pkg });

    Deno.serve(serverOptions, app.fetch);
    if (options.keyboard !== false) await HttpServer.keyboard({ port, print: true });
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
