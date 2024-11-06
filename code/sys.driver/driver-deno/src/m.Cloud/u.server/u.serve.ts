import { HttpServer, pkg as Package, type t } from './common.ts';
import { server } from './u.Server.ts';

/**
 * Start and serve the HTTP server.
 */
export const serve: t.DenoCloudServerLib['serve'] = async (...args: []) => {
  const options = wrangle.options(args);
  const port = options.port ?? 8080;
  const pkg = options.pkg ?? Package;
  const env = options.env ?? (await wrangle.env());
  const app = server({ env, pkg });
  const config = HttpServer.options(port, pkg);
  return Deno.serve(config, app.fetch);
};

/**
 * Helpers
 */
const wrangle = {
  async env() {
    const { env } = await import('../../env.ts');
    return env;
  },

  options(args: any[]): t.DenoCloudServeOptions {
    if (args.length === 0) return {};
    if (typeof args[0] === 'object') return args[0];
    if (typeof args[0] === 'number') {
      const port = args[0];
      const pkg = typeof args[1] === 'object' ? args[1] : undefined;
      return { port, pkg };
    }
    return {};
  },
} as const;
