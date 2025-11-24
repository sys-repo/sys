import {
  c,
  Crdt,
  Is,
  Net,
  NodeWSServerAdapter,
  pkg,
  Pkg,
  Rx,
  WebSocket,
  WebSocketServer,
  type t,
} from './common.ts';
import { createHttpServer, disposeHttpServer } from './u.http.ts';
import { monitorPeers } from './u.monitor.ts';
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

  installBrokenPipeTrap(silent);

  // Establish port to use.
  const port = Is.number(options.port) ? Net.port(options.port) : Net.port();
  if (Is.number(options.port) && options.port !== port) {
    const a = c.yellow(String(options.port));
    const b = c.bold(c.brightCyan(String(port)));
    const msg = `\n${c.yellow('Warning')} Requested port ${a} is in use. Using port ${b} instead.`;
    console.info(msg);
  }

  /**
   * Minimal HTTP handler on the same port as websocket-server
   * that can report meta-data over HTTP:GET.
   */
  const http = createHttpServer({ total: () => monitor.total });
  try {
    http.listen(port, host);
  } catch (cause) {
    throw new Error(`Failed to create HTTP server on ${host}:${port}`, { cause });
  }

  /**
   * Create WSS server bound to the HTTP server and bind to CRDT repo:
   */
  let wss: WebSocketServer;
  try {
    wss = new WebSocketServer({
      server: http,
      clientTracking: true,
      maxPayload,
      perMessageDeflate: false,
    });
  } catch (cause) {
    try {
      http.close();
    } catch {}
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
  wss.on('error', (err: unknown) => logWssError('[wss:error]', err, silent));
  wss.on('wsClientError', (err: unknown) => logWssError('[wss:error:client]', err, silent));

  // Custom headers handshake:
  wss.on('headers', (headers: string[]) => headers.push(`sys-pkg: ${Pkg.toString(pkg)}`));

  // Initialize the Automerge network and repo:
  let network: NodeWSServerAdapter;
  let repo: t.CrdtRepo;
  try {
    network = new NodeWSServerAdapter(wss as any, keepAliveInterval); // NB: <any> type-hack retained.
    repo = Crdt.repo({ dir, network, sharePolicy, denylist });
  } catch (err) {
    try {
      wss.close();
    } catch {}
    try {
      http.close();
    } catch {}
    throw err;
  }

  /**
   * Lifecycle:
   */
  async function cleanup() {
    try {
      await Promise.all([shutdown(wss), disposeHttpServer(http), repo.dispose()]);
    } catch (err) {
      console.error('[wss:shutdown:error]', err);
    }
  }
  const life = Rx.lifecycleAsync((options as any).dispose$, cleanup);
  const monitor = monitorPeers({ network, host, port, dir, silent }, life.dispose$);

  /**
   * Await startup (retry/backoff instead of single-shot):
   * (We still probe the TCP port, though http.listen has already bound it.)
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
    get url() {
      return Net.toUrl(addr, 'ws');
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

/**
 * Helpers:
 */
function isBrokenPipeError(err: unknown): boolean {
  if (err instanceof Deno.errors.BrokenPipe) return true;
  if (typeof err === 'object' && err !== null) {
    const code = (err as { code?: unknown }).code;
    if (code === 'EPIPE') return true;
  }
  return false;
}

function logWssError(prefix: string, err: unknown, silent?: boolean) {
  if (isBrokenPipeError(err)) {
    if (!silent) console.info(`${prefix} [broken-pipe]`);
    return;
  }
  console.error(prefix, err);
}

/**
 * Suppresses unhandled BrokenPipe/EPIPE rejections from dropped WS peers.
 * Safe: BrokenPipe only indicates a closed peer socket, not data loss.
 */
let brokenPipeTrapInstalled = false;
function installBrokenPipeTrap(silent?: boolean) {
  if (brokenPipeTrapInstalled) return;
  brokenPipeTrapInstalled = true;
  globalThis.addEventListener('unhandledrejection', (event) => {
    if (isBrokenPipeError(event.reason)) {
      // Treat as normal disconnect: don’t crash the server.
      event.preventDefault();
      if (!silent) console.info('[unhandledrejection][broken-pipe] peer disconnected during send');
    }
  });
}
