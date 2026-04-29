import {
  c,
  Crdt,
  Is,
  Net,
  NodeWSServerAdapter,
  Pkg,
  pkg,
  Rx,
  type t,
  WebSocket,
  WebSocketServer,
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

  // Enforce max-clients and attach per-socket error logging.
  wss.on('connection', (socket: WebSocket) => {
    // Guard against overload.
    if (wss.clients.size > maxClients) {
      try {
        socket.close(1013, 'server overloaded');
      } catch {}
      try {
        socket.terminate?.();
      } catch {}
      return;
    }

    // Ensure socket-level protocol errors (eg. max payload, broken pipe)
    // are logged and do not crash the process.
    socket.on('error', (err: unknown) => logWssError('[ws:error]', err, silent));
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
  const life = Rx.lifecycleAsync(options.until, cleanup);
  const monitor = monitorPeers({ network, host, port, dir, silent }, life.dispose$);

  /**
   * Await startup (retry/backoff instead of single-shot):
   * (We still probe the TCP port, though http.listen has already bound it.)
   */
  await probeListen(port, host, { attempts: 5, delay: 200, backoff: 1.5 });

  // Best-effort address; if the probe socket doesn't surface addr, synthesize.
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
function isMaxPayloadError(err: unknown): boolean {
  if (!(err instanceof RangeError)) return false;
  if (typeof err.message !== 'string') return false;
  return err.message.includes('Max payload size exceeded');
}

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

  if (isMaxPayloadError(err)) {
    if (!silent) console.error(`${prefix} [max-payload]`, err);
    return;
  }

  console.error(prefix, err);
}

/**
 * Detects Automerge WASM fatal traps (OOM / capacity overflow / aliasing) so we can
 * treat them as non-fatal at the process boundary.
 *
 * Signature is based on:
 *   - "__rg_oom" (Rust OOM hook) ← "out of memory"
 *   - "capacity overflow" / "alloc::raw_vec::capacity_overflow"
 *   - "recursive use of an object detected which would lead to unsafe aliasing in rust"
 *   - "automerge_wasm" in the stack
 *   - "RuntimeError: unreachable" from the WASM trap
 */
function isAutomergeOomError(err: unknown): boolean {
  if (!Is.error(err)) return false;

  const stack = typeof err.stack === 'string' ? err.stack : '';
  const text = `${err.name}: ${err.message}\n${stack}`.toLowerCase();
  const incl = (s: string) => text.includes(s);

  const triggers = [
    '__rg_oom',
    'capacity overflow',
    'alloc::raw_vec::capacity_overflow',
    'recursive use of an object detected which would lead to unsafe aliasing in rust',
    'automerge_wasm',
  ] as const;

  if (triggers.some(incl)) return true;
  if (incl('runtimeerror: unreachable') && incl('automerge::')) return true;

  return false;
}

/**
 * Suppresses known benign runtime errors:
 *
 * - BrokenPipe/EPIPE rejections from dropped WS peers.
 * - Automerge WASM OOM/aliasing traps during sync ("RuntimeError: unreachable" / __rg_oom / borrow_fail).
 *
 * Goal: keep the sync server process alive; peers/docs may fail, but the
 * daemon stays up and logs clearly what happened.
 */
let brokenPipeTrapInstalled = false;
function installBrokenPipeTrap(silent?: boolean) {
  if (brokenPipeTrapInstalled) return;
  brokenPipeTrapInstalled = true;

  globalThis.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;

    /**
     * Broken pipe.
     */
    if (isBrokenPipeError(reason)) {
      // Treat as normal disconnect: don't crash the server.
      event.preventDefault();
      if (!silent) console.info('[unhandledrejection][broken-pipe] peer disconnected during send');
      return;
    }

    /**
     * Automerge OOM/aliasing panic.
     */
    if (isAutomergeOomError(reason)) {
      // Automerge WASM ran out of memory or hit a capacity/aliasing panic
      // reconstructing a doc. Log and keep the server process alive.
      event.preventDefault();
      if (!silent) {
        const msg =
          `[unhandledrejection][automerge:oom] sync message caused Automerge OOM/panic (out-of-memory or capacity/aliasing overflow)`;
        const summary = Is.error(reason) ? `${reason.name}: ${reason.message}` : String(reason);
        console.error(msg, summary);
      }
      return;
    }

    // Fallthrough: other errors escalate normally
  });

  globalThis.addEventListener('error', (event) => {
    const reason = (event as ErrorEvent).error;

    if (isAutomergeOomError(reason)) {
      // Same OOM/capacity/aliasing case, but surfaced as a top-level error instead of a rejection.
      event.preventDefault();
      if (!silent) {
        const msg =
          `[error][automerge:oom] sync message caused Automerge OOM/panic (out-of-memory or capacity/aliasing overflow)`;
        const summary = Is.error(reason) ? `${reason.name}: ${reason.message}` : String(reason);
        console.error(msg, summary);
      }
    }
  });
}
