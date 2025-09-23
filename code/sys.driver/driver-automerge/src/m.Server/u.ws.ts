import type { t } from './common.ts';

import {
  c,
  Crdt,
  Is,
  Net,
  NodeWSServerAdapter,
  pkg,
  Pkg,
  rx,
  WebSocket,
  WebSocketServer,
} from './common.ts';
import { Log } from './u.print.ts';
import { shutdown } from './u.shutdown.ts';

export const ws: t.SyncServerLib['ws'] = async (options = {}) => {
  const {
    dir,
    sharePolicy,
    denylist,
    keepAliveInterval,
    silent = false,
    host = '127.0.0.1',
    maxClients = 1000,
    maxPayload = 16 * 1024 * 1024, // 16MB
  } = options;

  // Establish port to use.
  const port = Is.number(options.port) ? Net.port(options.port) : Net.port();
  if (Is.number(options.port) && options.port !== port) {
    const a = c.yellow(String(options.port));
    const b = c.bold(c.brightCyan(String(port)));
    const msg = `\n${c.yellow('Warning')} Requested port ${a} is in use. Using port ${b} instead.`;
    console.info(msg);
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
  } catch (cause) {
    throw new Error(`Failed to create WebSocketServer on ${host}:${port}`, { cause });
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

  // Observability on low-level server errors:
  wss.on('error', (err: unknown) => console.error('[wss:error]', err));

  // Custom headers handsake:
  wss.on('headers', (headers: string[], req) => {
    headers.push(`sys-module: ${Pkg.toString(pkg)}`);
  });

  // Initialize the Automerge network and repo:
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

  // Low level error logging.
  wss.on('error', (err) => console.error('[wss:error]', err));
  wss.on('wsClientError', (err) => console.error('[wss:error:client]', err));

  /**
   * Lifecycle:
   */
  const life = rx.lifecycleAsync((options as any).dispose$, async () => {
    try {
      await Promise.all([shutdown(wss), repo.dispose()]);
    } catch (err) {
      console.error('[wss:shutdown:error]', err);
    }
  });

  /**
   * Print status:
   */
  if (!silent) {
    Log.server({ port, dir });
    const metrics = () => Log.metrics({ dir, pad: true });
    const metricsLogger = Log.startInterval(life.dispose$, metrics);
    metrics();

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
