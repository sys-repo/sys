import type { t } from './common.ts';

/**
 * WebSocket command server primitive.
 */
export declare namespace WebSocketServer {
  /** Public WebSocket command server surface. */
  export type Lib = {
    /** Create a running WebSocket command server with caller-owned lifecycle. */
    create<
      N extends string = t.Cmd.Name,
      P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
      R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
      E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
    >(
      options: CreateOptions<N, P, R, E>,
    ): Started;

    /** Hosted startup convenience over `create`; optionally binds to host-process lifecycle. */
    start<
      N extends string = t.Cmd.Name,
      P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
      R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
      E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
    >(
      options: StartOptions<N, P, R, E>,
    ): Started;
  };

  /** Lifecycle ownership model for a running WebSocket server. */
  export type Lifecycle = 'manual' | 'process';

  /** Hosted terminal keyboard controls. */
  export namespace Keyboard {
    /** Keyboard options supported by hosted WebSocket startup. */
    export type Options = Pick<t.CliKeyboardBindOptions, 'exit'>;

    /** Keyboard input accepted by hosted WebSocket startup. */
    export type Input = boolean | Options;
  }

  /** Options for creating a WebSocket command server with caller-owned lifecycle. */
  export type CreateOptions<
    N extends string = t.Cmd.Name,
    P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
    R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
    E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
  > = {
    /** Hostname passed to `Deno.serve`. Defaults to the module default hostname. */
    hostname?: t.StringHostname;

    /** TCP port passed to `Deno.serve`. Defaults to the module default port. */
    port?: t.PortNumber;

    /** URL path accepted for WebSocket upgrades. Defaults to the module default path. */
    path?: t.StringUrlRoute;

    /** Typed command host grammar and handlers. */
    cmd: CommandOptions<N, P, R, E>;

    /** Optional request admission hook before WebSocket upgrade. */
    accept?: Accept;

    /** Optional owner HTTP sidecar for same-port diagnostics/projections. */
    http?: HttpOptions;

    /** Optional low-level hook for each accepted socket. */
    onSocket?: (context: SocketContext<N, P, R, E>) => void | Promise<void>;

    /** Structured, renderer-neutral status metadata for the running service handle. */
    status?: StatusOptions;

    /** Optional lifecycle boundary for auto-closing the server. */
    until?: t.UntilInput;
  };

  /** Options for hosted WebSocket command server startup. */
  export type StartOptions<
    N extends string = t.Cmd.Name,
    P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
    R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
    E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
  > = CreateOptions<N, P, R, E> & {
    /** Lifecycle ownership model. Defaults to `manual`; use `process` for standalone CLIs. */
    readonly lifecycle?: Lifecycle;

    /** Suppress direct-startup reporting for service runners that render their own status. */
    readonly silent?: boolean;

    /** Enable terminal keyboard quit controls for direct hosted startup. */
    readonly keyboard?: Keyboard.Input;
  };

  /** Running WebSocket command server handle. */
  export type Started = t.LifecycleAsync & t.Service.Handle & {
    /** Underlying Deno HTTP server. */
    readonly server: Deno.HttpServer<Deno.NetAddr>;

    /** Bound network address. */
    readonly addr: Deno.NetAddr;

    /** Bound hostname. */
    readonly hostname: t.StringHostname;

    /** Bound TCP port. */
    readonly port: t.PortNumber;

    /** Local HTTP origin, e.g. `http://localhost:8080`. */
    readonly origin: t.StringUrl;

    /** Local WebSocket URL for the accepted path. */
    readonly url: t.StringUrl;

    /** Server lifecycle signal; aborted when the server closes. */
    readonly signal: AbortSignal;

    /** Resolves when the underlying Deno server has finished. */
    readonly finished: Promise<void>;

    /** Renderer-neutral service status snapshot. */
    status(): t.Service.Status;

    /** WebSocket/domain alias for `dispose()`. */
    close(reason?: unknown): Promise<void>;
  };

  /** Structured status metadata surfaced by WebSocket server handles. */
  export type StatusOptions = {
    /** Optional owner-local display name. */
    readonly name?: string;

    /** Owner-local kind. Defaults to `websocket:cmd`. */
    readonly kind?: string;

    /** Primary served filesystem root, if this service has one. */
    readonly root?: t.StringDir;

    /** Owner config path, if the owner knows it. */
    readonly config?: t.StringPath;

    /** Label for the WebSocket URL. Defaults to `websocket`. */
    readonly urlLabel?: string;

    /** Extra owner facts that are not URLs and not lifecycle control. */
    readonly details?: readonly t.Service.Detail[];
  };

  /** Owner HTTP sidecar mounted on the same server as the WebSocket route. */
  export type HttpOptions = {
    /** Return a response to handle the request, or `undefined` to continue WebSocket admission. */
    readonly handle: HttpHandler;

    /** Requestable owner HTTP URLs to report in service status. */
    readonly urls?: readonly HttpStatusUrl[];
  };

  /** Owner HTTP sidecar handler. */
  export type HttpHandler = (
    request: Request,
  ) => Response | undefined | Promise<Response | undefined>;

  /** HTTP status URL path resolved against the server origin. */
  export type HttpStatusUrl =
    | t.StringUrlRoute
    | { readonly path: t.StringUrlRoute; readonly label?: string };

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
