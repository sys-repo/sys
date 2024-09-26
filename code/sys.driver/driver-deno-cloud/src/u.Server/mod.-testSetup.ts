import { env } from '../env.ts';
import { Http, type t } from './common/mod.ts';
import { DenoCloud } from './mod.ts';

/**
 * Setup a server
 */
export function testSetup(options: { authEnabled?: boolean } = {}) {
  const {
    authEnabled = false, // NB: by default, auth checks not performed during testing.
  } = options;

  const log = new Set<t.AuthLogEntry>();
  const app = DenoCloud.server({
    env,
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
