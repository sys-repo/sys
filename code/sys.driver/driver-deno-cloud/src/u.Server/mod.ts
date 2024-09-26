import { DenoCloudClient, HttpServer, type t } from './common/mod.ts';
import { server } from './u.Server.ts';

export { c, Env, HttpServer, Pkg } from './common/mod.ts';

/**
 * Server library.
 */
export const DenoCloud: t.DenoCloudServerLib = {
  client: DenoCloudClient.client,
  server,

  async env() {
    const { env } = await import('../env.ts');
    return env;
  },

  async serve(options = {}) {
    const { port = 8080, Pkg } = options;
    const env = options.env ?? (await DenoCloud.env());
    const app = DenoCloud.server({ env });
    const config = HttpServer.options(port, Pkg);
    return Deno.serve(config, app.fetch);
  },
};
