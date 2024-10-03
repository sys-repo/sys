import { DenoCloudClient, HttpServer, Pkg, type t } from './common.ts';
import { server } from './u.Server.ts';

export { c, Env, HttpServer, Pkg } from './common.ts';

/**
 * Server library.
 */
export const DenoCloud: t.DenoCloudServerLib = {
  client: DenoCloudClient.client,
  server,

  async env() {
    const { env } = await import('../../env.ts');
    return env;
  },

  async serve(options = {}) {
    const { port = 8080 } = options;
    const pkg = options.Pkg ?? Pkg;
    const env = options.env ?? (await DenoCloud.env());
    const app = DenoCloud.server({ env });
    const config = HttpServer.options(port, pkg);
    return Deno.serve(config, app.fetch);
  },
};
