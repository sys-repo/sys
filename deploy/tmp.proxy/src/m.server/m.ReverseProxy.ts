import { D, Http, pkg, type t } from './common.ts';

export const ReverseProxy: t.ReverseProxy.Lib = {
  create(options = {}) {
    const app = Http.Server.create({ pkg, static: false });

    app.get('/', (c) => {
      return c.json({
        ok: true,
        service: pkg.name,
        port: options.port ?? D.port,
      });
    });

    return app;
  },

  async start(options = {}) {
    const port = options.port ?? D.port;
    const app = ReverseProxy.create(options);
    const serverOptions = Http.Server.options({ port, pkg });

    Deno.serve(serverOptions, app.fetch);
    await Http.Server.keyboard({ port, print: true });
  },
};
