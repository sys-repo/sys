import type { t } from './common.ts';
import { Crdt, Is, Net, NodeWSServerAdapter, WebSocketServer, c, rx } from './common.ts';
import { Log } from './u.Log.ts';
import { shutdown } from './u.shutdown.ts';

/**
 * Tools for working with CRDT sync servers:
 */
export const Server: t.CrdtServerLib = {
  async ws(options = {}) {
    const { dir, sharePolicy, denylist, keepAliveInterval, silent = false } = options;
    const port = Is.number(options.port) ? Net.port(options.port) : Net.port();

    /**
     * Lifecycle:
     */
    const life = rx.lifecycleAsync(options.dispose$, async () => {
      await Promise.all([
        //
        await shutdown(wss),
        await repo.dispose(),
      ]);
    });

    /**
     * Create WSS server and bind to CRDT repo:
     */
    const wss = new WebSocketServer({ port });
    const network = new NodeWSServerAdapter(wss as any, keepAliveInterval); // NB: <any> → type-hack.
    const repo = Crdt.repo({ dir, network, sharePolicy, denylist });

    /**
     * Print status:
     */
    if (!silent) {
      Log.server({ port, dir });

      /**
       * Log activity:
       */
      network.on('peer-candidate', (e) => {
        console.info(c.white('connected:   '), c.green(e.peerId));
      });

      network.on('peer-disconnected', (e) => {
        console.info(c.gray(c.dim('disconnected:')), c.gray(e.peerId));
      });

      /**
       * Log metrics:
       */
      setInterval(Log.memory, 60_000);
      Log.memory();
    }

    /**
     * API:
     */
    return {
      port,
      get repo() {
        return repo;
      },

      /**
       * Lifecycle:
       */
      dispose: life.dispose,
      dispose$: life.dispose$,
      get disposed() {
        return life.disposed;
      },
    };
  },
};
