import type { t } from './common.ts';

import { c, Crdt, Is, Net, NodeWSServerAdapter, rx, WebSocket, WebSocketServer } from './common.ts';
import { Log } from './u.Log.ts';
import { shutdown } from './u.shutdown.ts';

/**
 * Tools for working with CRDT sync servers:
 */
export const Server: t.CrdtServerLib = {
  async ws(options = {}) {
    const {
      dir,
      sharePolicy,
      denylist,
      keepAliveInterval,
      silent = false,

      // Hardened runtime knobs (optional):
      host = '127.0.0.1',
      maxClients = 1000,
      maxPayload = 16 * 1024 * 1024, // 16MB
    } = options;

    const port = Is.number(options.port) ? Net.port(options.port) : Net.port();

    // Early option sanity (fail fast, explicit):
    if (dir && typeof dir !== 'string') {
      throw new Error(`Invalid "dir" option: expected string.`);
    }

    /**
     * Create WSS server and bind to CRDT repo:
     */
    let wss: WebSocketServer;
    try {
      wss = new WebSocketServer({
        port,
        host,
        clientTracking: true,
        maxPayload,
        perMessageDeflate: false,
      });
    } catch (err) {
      throw new Error(`Failed to create WebSocketServer on ${host}:${port}`, { cause: err });
    }

    // Enforce max-clients:
    wss.on('connection', (ws: WebSocket) => {
      if (wss.clients.size > maxClients) {
        try {
          ws.close(1013, 'server overloaded');
        } catch {}
        try {
          ws.terminate?.();
        } catch {}
      }
    });

    // Observability for low-level server errors:
    wss.on('error', (err: unknown) => {
      console.error('[wss:error]', err);
    });

    let network: NodeWSServerAdapter;
    let repo: t.CrdtRepo;

    try {
      network = new NodeWSServerAdapter(wss as any, keepAliveInterval); // NB: <any> type-hack retained.
      repo = Crdt.repo({ dir, network, sharePolicy, denylist });
    } catch (err) {
      try {
        wss.close();
      } catch {
        /* noop */
      }
      throw err;
    }

    // Network-level error visibility.
    (network as any).on?.('error', (err: unknown) => console.error('[network:error]', err));

    /**
     * Lifecycle:
     */
    const life = rx.lifecycleAsync((options as any).dispose$, async () => {
      try {
        await Promise.all([shutdown(wss), repo.dispose()]);
      } catch (err) {
        console.error('[server:shutdown:error]', err);
      }
    });

    /**
     * Print status:
     */
    if (!silent) {
      const metrics = () => Log.metrics({ dir, pad: true });

      Log.server({ port, dir });
      metrics();
      const metricsLogger = Log.startInterval(life.dispose$, metrics);

      /**
       * Log activity:
       */
      network.on?.('peer-candidate', (e: any) => {
        console.info(c.white('connected:   '), c.green(e.peerId));
        metricsLogger.ping();
      });

      (network as any).on?.('peer-disconnected', (e: any) => {
        console.info(c.gray(c.dim('disconnected:')), c.gray(e.peerId));
        metricsLogger.ping();
      });
    }

    /**
     * Await startup (retry/backoff instead of single-shot):
     */
    await probeListen(port, host, { attempts: 5, delay: 200, backoff: 1.5 });

    // Best-effort address; if the probe socket doesn’t surface addr, synthesize.
    const addr = { hostname: host, port } as unknown as Deno.NetAddr;

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

/**
 * Small TCP probe with retries/backoff to ensure the port is truly accepting connections.
 * Keeps your existing Net.connect, just adds determinism.
 */
async function probeListen(
  port: number,
  host: string,
  opts: { attempts: number; delay: number; backoff: number },
) {
  const res = await Net.connect(port, {
    hostname: host,
    attempts: opts.attempts,
    delay: opts.delay,
    backoff: opts.backoff,
  });
  if (res.error || !res.socket) {
    throw new Error(`Failed to start server on ${host}:${port}`, { cause: res.error });
  }
  res.socket.close();
}
