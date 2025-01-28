import { env } from '../env.ts';
import { pkg } from './common.ts';
import { Http, type t } from './ns.server/common.ts';
import { DenoCloud } from './ns.server/mod.ts';

/**
 * Setup a server
 */
export function testSetup(options: { authEnabled?: boolean } = {}) {
  const authEnabled = options.authEnabled ?? false; // NB: by default, auth checks are not performed during testing.
  const log = new Set<t.AuthLogEntry>();
  const app = DenoCloud.server({
    env,
    pkg,
    authEnabled,
    authLogger: (e) => log.add(e),
  });
  const listener = Deno.serve({ port: 0 }, app.fetch);

  const dispose = () => listener.shutdown();
  const url = Http.url(listener.addr);
  const client = DenoCloud.client(url.base);

  return {
    dispose,
    app,
    client,
    url,
    log: {
      get count() {
        return log.size;
      },
      get items() {
        return Array.from(log);
      },
    },
  } as const;
}
