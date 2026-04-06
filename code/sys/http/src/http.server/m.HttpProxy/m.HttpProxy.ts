import { D, Http, HttpServer, pkg, type t } from './common.ts';
import { HttpProxyResolver } from './m.Resolver.ts';

export const HttpProxy: t.HttpProxy.Lib = {
  create(options = {}) {
    const resolver = HttpProxyResolver(options.config ?? {});
    const app = HttpServer.create({ pkg, static: false, cors: false });

    app.all('*', async (c) => {
      const url = new URL(c.req.raw.url);
      const result = resolver(url.pathname as t.StringUrlRoute);

      if (result.kind === 'redirect') {
        return c.redirect(`${result.location}${url.search}`, 308);
      }

      if (result.kind === 'none') {
        return c.notFound();
      }

      const upstream = `${result.upstream}${url.search}`;

      try {
        return await fetch(new Request(upstream, c.req.raw));
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
