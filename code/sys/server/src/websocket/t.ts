import type { t } from './common.ts';

/**
 * WebSocket command server primitive.
 */
export declare namespace WebSocketServer {
  /** Public WebSocket command server surface. */
  export type Lib = {
    /** Start a WebSocket server bound to a typed command grammar. */
    create<
      N extends string = t.Cmd.Name,
      P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
      R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
      E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
    >(
      options: CreateOptions<N, P, R, E>,
    ): Started;
  };

  /** Options for starting a WebSocket command server. */
  export type CreateOptions<
    N extends string = t.Cmd.Name,
    P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
    R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
    E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
  > = {
    /** Hostname passed to `Deno.serve`. Defaults to `127.0.0.1`. */
    hostname?: t.StringHostname;

    /** TCP port passed to `Deno.serve`. */
    port?: t.PortNumber;

    /** URL path accepted for WebSocket upgrades. Defaults to `/`. */
    path?: t.StringUrlRoute;

    /** Typed command host grammar and handlers. */
    cmd: CommandOptions<N, P, R, E>;

    /** Optional request admission hook before WebSocket upgrade. */
    accept?: Accept;

    /** Optional low-level hook for each accepted socket. */
    onSocket?: (context: SocketContext<N, P, R, E>) => void;

    /** Optional lifecycle boundary for auto-closing the server. */
    until?: t.UntilInput;
  };

  /** Running WebSocket command server handle. */
  export type Started = t.LifecycleAsync & {
    /** Underlying Deno HTTP server. */
    readonly server: Deno.HttpServer<Deno.NetAddr>;

    /** Bound network address. */
    readonly addr: Deno.NetAddr;

    /** Bound hostname. */
    readonly hostname: t.StringHostname;

    /** Bound TCP port. */
    readonly port: t.PortNumber;

    /** Local HTTP origin, e.g. `http://127.0.0.1:8080`. */
    readonly origin: t.StringUrl;

    /** Local WebSocket URL for the accepted path. */
    readonly url: t.StringUrl;

    /** Server lifecycle signal; aborted when the server closes. */
    readonly signal: AbortSignal;

    /** Resolves when the underlying Deno server has finished. */
    readonly finished: Promise<void>;

    /** WebSocket/domain alias for `dispose()`. */
    close(reason?: unknown): Promise<void>;
  };

  /** Request admission hook. Return `false` to reject or a `Response` to return it directly. */
  export type Accept = (request: Request) => boolean | Response | Promise<boolean | Response>;

  /** Accepted socket context passed to the low-level socket hook. */
  export type SocketContext<
    N extends string = t.Cmd.Name,
    P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
    R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
    E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
  > = {
    /** Original HTTP upgrade request. */
    readonly request: Request;

    /** Raw WebSocket escape hatch. */
    readonly socket: WebSocket;

    /** Cmd endpoint adapted from the WebSocket. */
    readonly endpoint: t.Cmd.Endpoint;

    /** Cmd host bound to the socket endpoint. */
    readonly host: t.Cmd.Host.Handle;
  };

  /** Typed command host configuration. */
  export type CommandOptions<
    N extends string = t.Cmd.Name,
    P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
    R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
    E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
  > = {
    /** Optional command namespace for shared transports. */
    ns?: t.Cmd.Namespace;

    /** Command handlers attached to each accepted WebSocket. */
    handlers: t.Cmd.Handler.Map<N, P, R, E>;
  };
}
