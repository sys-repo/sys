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
        shutdown(wss),
        repo.dispose(),
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
     * Await startup:
     */
    const conn = await Net.connect(port);
    conn.socket?.close();
    const addr = conn.socket?.remoteAddr;
    if (conn.error || !addr) throw new Error(`Failed to start server.`, { cause: conn.error });

    /**
     * API:
     */
    return {
      get repo() {
        return repo;
      },
      get addr() {
        return addr;
      },

      /**
       * Lifecycle:
       */
      dispose: life.dispose,
      get dispose$() {
        return life.dispose$;
      },
      get disposed() {
        return life.disposed;
      },
    };
  },
};
