import type { t } from './common.ts';

/**
 * HTTP JSON transport for unary Cmd request/response calls.
 */
export declare namespace HttpCmd {
  /** Fetch implementation used by the HTTP Cmd client. */
  export type Fetch = t.Fetch;

  /** Public HTTP Cmd API. */
  export type Lib = {
    /** Create a Fetch-compatible request handler bound to Cmd handlers. */
    handler<
      N extends string = t.Cmd.Name,
      P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
      R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
      E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
    >(
      options: HandlerOptions<N, P, R, E>,
    ): RequestHandler;

    /** Handle a single HTTP request against Cmd handlers. */
    handle<
      N extends string = t.Cmd.Name,
      P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
      R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
      E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
    >(
      request: Request,
      options: HandlerOptions<N, P, R, E>,
    ): Promise<Response>;

    /** Create a typed unary Cmd client over HTTP JSON. */
    client<
      N extends string = t.Cmd.Name,
      P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
      R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
    >(
      options: ClientOptions,
    ): Client<N, P, R>;
  };

  /** Fetch-compatible request handler. */
  export type RequestHandler = (request: Request) => Response | Promise<Response>;

  /** Transport options for a Fetch-compatible Cmd request handler. */
  export type HandlerOptions<
    N extends string = t.Cmd.Name,
    P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
    R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
    E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
  > = {
    /** Optional route path accepted by the handler. If omitted, all paths are accepted. */
    readonly path?: t.StringUrlRoute;

    /** Typed command grammar and handlers. */
    readonly cmd: CommandOptions<N, P, R, E>;
  };

  /** Typed Cmd host configuration shared with other Cmd transports. */
  export type CommandOptions<
    N extends string = t.Cmd.Name,
    P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
    R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
    E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
  > = {
    /** Optional command namespace for shared HTTP endpoints. */
    readonly ns?: t.Cmd.Namespace;

    /**
     * Command handlers invoked for matching HTTP Cmd requests.
     *
     * Event maps keep handlers compatible with full Cmd transports. This HTTP JSON
     * transport is unary; events emitted through `ctx.emit(...)` are intentionally ignored.
     */
    readonly handlers: t.Cmd.Handler.Map<N, P, R, E>;
  };

  /** Options for an HTTP Cmd client. */
  export type ClientOptions = {
    /** Absolute HTTP URL for the Cmd endpoint. */
    readonly url: t.StringUrl;

    /** Optional command namespace attached to outgoing requests. */
    readonly ns?: t.Cmd.Namespace;

    /** Optional fetch implementation. Defaults to `globalThis.fetch`. */
    readonly fetch?: Fetch;

    /** Optional timeout in milliseconds for each command request. */
    readonly timeout?: t.Msecs;

    /** Optional extra request headers. */
    readonly headers?: HeadersInit;
  };

  /** Unary Cmd client over HTTP JSON. */
  export type Client<
    N extends string,
    P extends t.Cmd.Payload.Map<N>,
    R extends t.Cmd.Result.Map<N>,
  > = t.Cmd.Client.Unary<N, P, R>;
}
