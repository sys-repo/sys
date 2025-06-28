/**
 * Server tools for interacting with the Deno cloud.
 * @module
 *
 * @example
 * ```ts
 * import { DenoCloud } from '@sys/driver-deno/cloud/server';
 * DenoCloud.serve(8080);
 *
 * ↓
 *
 * Module   @sys/driver-deno 0.0.x
 *          http://localhost:8080/
 * ```
 */
import type { DenoCloudServerLib } from './t.ts';

import { DenoCloudClient } from './common.ts';
import { server } from './u.Server.ts';
import { serve } from './u.serve.ts';

export { c, Env, HttpServer, pkg } from './common.ts';

/**
 * Server library.
 */
export const DenoCloud: DenoCloudServerLib = {
  client: DenoCloudClient.client,
  server,
  serve,
  async env() {
    const { env } = await import('../../env.ts');
    return env;
  },
};
