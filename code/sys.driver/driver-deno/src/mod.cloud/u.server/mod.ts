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

  async serve(...args: []) {
    const options = wrangle.options(args);
    const port = options.port ?? 8080;
    const pkg = options.Pkg ?? Pkg;
    const env = options.env ?? (await DenoCloud.env());
    const app = DenoCloud.server({ env });
    const config = HttpServer.options(port, pkg);
    return Deno.serve(config, app.fetch);
  },
};

/**
 * Helpers
 */
const wrangle = {
  options(args: any[]): t.DenoCloudServeOptions {
    if (args.length === 0) return {};
    if (typeof args[0] === 'object') return args[0];
    if (typeof args[0] === 'number') {
      const port = args[0];
      const Pkg = typeof args[1] === 'object' ? args[1] : undefined;
      return { port, Pkg };
    }
    return {};
  },
} as const;
