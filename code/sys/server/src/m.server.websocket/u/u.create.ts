import { Cmd, D, Dispose, Is, type t, Time } from '../common.ts';
import { acceptRequest } from './u.accept.ts';
import { closeConnections, trackConnection } from './u.lifecycle.ts';
import { localOrigin, localWebSocketUrl, normalizePath } from './u.origin.ts';
import { closeSocket } from './u.socket.ts';
import { type RuntimeStatus, serviceError, serviceStatus } from './u.status.ts';

type ListenAddress = t.WebSocketServer.ListenAddress;
type AddressInUseError = t.WebSocketServer.AddressInUseError;

/** Create a running WebSocket command server with caller-owned lifecycle. */
export function create<
  N extends string = t.Cmd.Name,
  P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(input: t.WebSocketServer.CreateOptions<N, P, R, E>): t.WebSocketServer.Started {
  const hostname = (input.hostname ?? D.serve.hostname) as t.StringHostname;
  const path = normalizePath(input.path);
  const controller = new AbortController();
  const connections = new Set<{ readonly socket: WebSocket; readonly host: t.Cmd.Host.Handle }>();
  const cmd = Cmd.make<N, P, R, E>({ ns: input.cmd.ns });

  const requestedAddress: ListenAddress = { hostname, port: input.port ?? D.serve.port };
  const server = createServer(requestedAddress, async (request) => {
    const httpResponse = await input.http?.handle(request);
    if (httpResponse) return httpResponse;

    const accepted = await acceptRequest(request, { path, accept: input.accept });
    if (!accepted.ok) return accepted.response;

    const { socket, response } = Deno.upgradeWebSocket(request);
    const endpoint = Cmd.Transport.fromWebSocket(socket);
    const host = cmd.host(endpoint, input.cmd.handlers);
    trackConnection(connections, { socket, host });

    callSocketHook(input.onSocket, { request, socket, endpoint, host });

    return response;
  });

  const addr = server.addr as Deno.NetAddr;
  const port = addr.port as t.PortNumber;
  const origin = localOrigin({ hostname, port });
  const url = localWebSocketUrl({ origin, path });
  const httpUrls = statusHttpUrls(origin, input.http?.urls);
  const runtime: RuntimeStatus = { state: 'ready' };
  let closing: Promise<void> | undefined;

  const life = Dispose.lifecycleAsync(input.until, async (e) => {
    runtime.state = 'stopping';
    try {
      closing ??= closeServer({
        server,
        controller,
        connections,
        reason: e.reason,
      });
      await closing;
      runtime.state = 'stopped';
    } catch (cause) {
      runtime.state = 'error';
      runtime.error = serviceError(cause);
      throw cause;
    }
  });

  disposeWhenServerFinishes({ server, life, controller });

  return {
    server,
    addr,
    hostname,
    port,
    origin,
    url,
    signal: controller.signal,
    finished: server.finished,

    status() {
      return serviceStatus({
        options: input.status,
        url,
        httpUrls,
        path,
        ns: input.cmd.ns,
        connections: connections.size,
        runtime,
      });
    },

    get disposed() {
      return life.disposed;
    },

    get dispose$() {
      return life.dispose$;
    },

    async dispose(reason) {
      await life.dispose(reason);
    },

    async close(reason) {
      await life.dispose(reason);
    },
  };
}

/**
 * Helpers:
 */
function createServer(address: ListenAddress, handler: Deno.ServeHandler) {
  try {
    return Deno.serve(
      {
        hostname: address.hostname,
        port: address.port,
        onListen() {
          // Keep the primitive silent by default.
        },
      },
      handler,
    );
  } catch (cause) {
    if (cause instanceof Deno.errors.AddrInUse) throw addressInUseError(address, cause);
    throw cause;
  }
}

function addressInUseError(
  address: ListenAddress,
  cause: Deno.errors.AddrInUse,
): AddressInUseError {
  const error = new Error(
    `WebSocketServer.create: address already in use: ${formatListenAddress(address)}.`,
    { cause },
  ) as AddressInUseError;
  Object.assign(error, { kind: 'WebSocketServerAddressInUse', address });
  return error;
}

function formatListenAddress(address: ListenAddress) {
  const hostname = address.hostname.includes(':') && !address.hostname.startsWith('[')
    ? `[${address.hostname}]`
    : address.hostname;
  return `${hostname}:${address.port}`;
}

function callSocketHook<
  N extends string,
  P extends t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(
  hook:
    | ((context: t.WebSocketServer.SocketContext<N, P, R, E>) => void | Promise<void>)
    | undefined,
  context: t.WebSocketServer.SocketContext<N, P, R, E>,
) {
  try {
    const result = hook?.(context);
    if (Is.promise(result)) void result.catch((error) => deferSocketHookFailure(context, error));
  } catch (error) {
    deferSocketHookFailure(context, error);
  }
}

function deferSocketHookFailure<
  N extends string,
  P extends t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(context: t.WebSocketServer.SocketContext<N, P, R, E>, error: unknown) {
  // Deno opens the socket only after the upgrade response is returned.
  // Defer close so hook failures settle as WebSocket closes, not handler failures.
  void Time.wait(0).then(() => failSocketHook(context, error));
}

function failSocketHook<
  N extends string,
  P extends t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(context: t.WebSocketServer.SocketContext<N, P, R, E>, error: unknown) {
  closeSocket(context.socket, D.socketHookFailure);
  if (!context.host.disposed) context.host.dispose(error);
}

function statusHttpUrls(
  origin: t.StringUrl,
  input: readonly t.WebSocketServer.HttpStatusUrl[] | undefined,
): readonly t.Service.Url[] {
  return (input ?? []).map((item) => {
    const path = Is.str(item) ? item : item.path;
    const label = Is.str(item) ? undefined : item.label;
    const href = new URL(normalizePath(path), origin).href as t.StringUrl;
    return label === undefined ? { href } : { href, label };
  });
}

function disposeWhenServerFinishes(args: {
  readonly server: Deno.HttpServer<Deno.NetAddr>;
  readonly life: t.LifecycleAsync;
  readonly controller: AbortController;
}) {
  const dispose = (reason: unknown = D.DisposeReason.serverFinished) => {
    if (args.life.disposed || args.controller.signal.aborted) return;
    void args.life.dispose(reason).catch(() => {
      // `server.finished` remains the authoritative completion/error surface.
    });
  };

  void args.server.finished.then(() => dispose(), dispose);
}

async function closeServer(args: {
  readonly server: Deno.HttpServer<Deno.NetAddr>;
  readonly controller: AbortController;
  readonly connections: Set<{ readonly socket: WebSocket; readonly host: t.Cmd.Host.Handle }>;
  readonly reason?: unknown;
}) {
  if (!args.controller.signal.aborted) args.controller.abort(args.reason);
  closeConnections(args.connections, args.reason);
  await args.server.shutdown();
  await args.server.finished;
}
