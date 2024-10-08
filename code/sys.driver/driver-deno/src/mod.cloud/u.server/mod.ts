import { DenoCloudClient, type t } from './common.ts';
import { server } from './u.Server.ts';
import { serve } from './u.serve.ts';

export { c, Env, HttpServer, Pkg } from './common.ts';

/**
 * Server library.
 */
export const DenoCloud: t.DenoCloudServerLib = {
  client: DenoCloudClient.client,
  server,
  serve,
  async env() {
    const { env } = await import('../../env.ts');
    return env;
  },
};
