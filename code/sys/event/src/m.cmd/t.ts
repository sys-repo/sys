import type { t } from './common.ts';

/**
 * Typed command algebra over any message endpoint.
 */
export declare namespace Cmd {
  /** Namespace-style library surface for the command bus. */
  export type Lib = {
    /** Type guards for command wire messages and command errors. */
    readonly Is: Is.Lib;

    /** Transport adapters for wiring Cmd to message endpoints. */
    readonly Transport: Transport.Lib;

    /** Create a typed command instance for a specific command set. */
    readonly make: Make.Factory;
  };

  /** Command identifying name, typically dotted or slash-delimited. */
  export type Name = string;

  /** Optional routing domain for command messages sharing a transport. */
  export type Namespace = string;

  /** Unique identifier for a client → host command request. */
  export type ReqId = `req-${string}`;

  /** Minimal MessagePort-like endpoint used by the command bus. */
  export type Endpoint = {
    postMessage(data: unknown): void;
    addEventListener(type: 'message', fn: (event: MessageEvent) => void): void;
    removeEventListener(type: 'message', fn: (event: MessageEvent) => void): void;
    start?: () => void;
    close?: () => void;
  };

  /** Factory for a typed command set. */
  export type Factory<
    N extends string,
    P extends Payload.Map<N>,
    R extends Result.Map<N>,
    E extends Event.Map<N> = Event.Map<N>,
  > = {
    host(endpoint: Endpoint, handlers: Handler.Map<N, P, R, E>, opts?: Host.Options): Host.Handle;
    client(endpoint: Endpoint, opts?: Client.Options): Client.Handle<N, P, R, E>;
  };

  /** Per-command request payloads. */
  export namespace Payload {
    export type Map<N extends string = Name> = { readonly [K in N]: unknown };
  }

  /** Per-command terminal result payloads. */
  export namespace Result {
    export type Map<N extends string = Name> = { readonly [K in N]: unknown };
  }

  /** Per-command streaming event payloads. */
  export namespace Event {
    export type Map<N extends string = Name> = { readonly [K in N]: unknown };
  }

  /** Host-side command handlers. */
  export namespace Handler {
    /** Context passed to a host-side command handler. */
    export type Context<
      N extends string,
      E extends Event.Map<N>,
      K extends N = N,
    > = {
      readonly id: ReqId;
      readonly name: K;
      readonly ns?: Namespace;
      readonly signal: AbortSignal;
      emit(event: E[K]): void;
    };

    /** Host-side handler function for a single command name. */
    export type Fn<
      N extends string,
      P extends Payload.Map<N>,
      R extends Result.Map<N>,
      E extends Event.Map<N> = Event.Map<N>,
      K extends N = N,
    > = (payload: P[K], ctx: Context<N, E, K>) => R[K] | Promise<R[K]>;

    /** Host-side handler map keyed by command name. */
    export type Map<
      N extends string,
      P extends Payload.Map<N>,
      R extends Result.Map<N>,
      E extends Event.Map<N> = Event.Map<N>,
    > = {
      readonly [K in N]: Fn<N, P, R, E, K>;
    };
  }

  /** Command client contract. */
  export namespace Client {
    /** Options passed to `Cmd.make().client()`. */
    export type Options = {
      /** Optional timeout in milliseconds for each command request. */
      timeout?: t.Msecs;

      /** Close the underlying endpoint when the client is disposed. Defaults to false. */
      closeEndpoint?: boolean;
    };

    /** Unary command client surface. */
    export type Unary<
      N extends string,
      P extends Payload.Map<N>,
      R extends Result.Map<N>,
    > = t.Lifecycle & {
      send<K extends N>(name: K, payload: P[K]): Promise<R[K]>;
    };

    /** Full command client: unary + streaming. */
    export type Handle<
      N extends string,
      P extends Payload.Map<N>,
      R extends Result.Map<N>,
      E extends Event.Map<N> = Event.Map<N>,
    > = Unary<N, P, R> & {
      stream<K extends N>(name: K, payload: P[K]): Stream.Handle<N, R, E, K>;
    };
  }

  /** Command host contract. */
  export namespace Host {
    /** Host handle lifecycle. */
    export type Handle = t.Lifecycle;

    /** Options passed to `Cmd.make().host()`. */
    export type Options = {
      /** Close the underlying endpoint when the host is disposed. Defaults to false. */
      closeEndpoint?: boolean;
    };
  }

  /** Streaming command invocation contract. */
  export namespace Stream {
    /** Handle returned from a streaming command invocation. */
    export type Handle<
      N extends string,
      R extends Result.Map<N>,
      E extends Event.Map<N> = Event.Map<N>,
      K extends N = N,
    > = AsyncIterable<E[K]> & {
      readonly id: ReqId;
      readonly done: Promise<R[K]>;
      dispose(): void;
      onEvent(fn: (event: E[K]) => void): t.Lifecycle;
    };
  }

  /** Command wire protocol. */
  export namespace Wire {
    /** Discriminant for command wire messages. */
    export type Kind = 'cmd' | 'cmd:event' | 'cmd:result' | 'cmd:cancel';

    /** Union of all command wire envelopes. */
    export type Envelope = Request | Event | Result | Cancel;

    /** Wire envelope sent from client → host. */
    export type Request = {
      readonly kind: 'cmd';
      readonly id: ReqId;
      readonly ns?: Namespace;
      readonly name: Name;
      readonly payload?: unknown;
    };

    /** Wire envelope sent from host → client for streamed events. */
    export type Event = {
      readonly kind: 'cmd:event';
      readonly id: ReqId;
      readonly name: Name;
      readonly ns?: Namespace;
      readonly payload?: unknown;
    };

    /** Wire envelope sent from host → client with a terminal result. */
    export type Result = {
      readonly kind: 'cmd:result';
      readonly id: ReqId;
      readonly name: Name;
      readonly ns?: Namespace;
      readonly payload?: unknown;
      readonly error?: string;
    };

    /** Wire envelope sent from client → host to cancel an active request. */
    export type Cancel = {
      readonly kind: 'cmd:cancel';
      readonly id: ReqId;
      readonly name: Name;
      readonly ns?: Namespace;
      readonly reason?: string;
    };
  }

  /** Command-client error contract. */
  export namespace Error {
    /** Classification for command-client errors. */
    export type Kind =
      | 'CmdError.Timeout'
      | 'CmdError.ClientDisposed'
      | 'CmdError.Remote'
      | 'CmdError.Cancelled';

    /** Context attached to command-client errors. */
    export type Meta = {
      readonly name: Name;
      readonly id?: ReqId;
      readonly ns?: Namespace;
    };

    /** Error instance produced by the command client. */
    export type Instance = globalThis.Error & {
      readonly name: Kind;
      readonly cmd?: Meta;
      readonly ns?: Namespace;
    };
  }

  /** Type guards. */
  export namespace Is {
    export type Lib = {
      request(input: unknown): input is Wire.Request;
      event(input: unknown): input is Wire.Event;
      response(input: unknown): input is Wire.Result;
      cancel(input: unknown): input is Wire.Cancel;
      error(input: unknown): input is Error.Instance;
    };
  }

  /** Transport adapters for wiring Cmd to message endpoints. */
  export namespace Transport {
    export type Lib = {
      /** Create a local Cmd<T> host bound to one side of a MessageChannel. */
      local: LocalFactory;
      /** Adapt a WebSocket into a Cmd endpoint using JSON-encoded messages. */
      fromWebSocket(ws: WebSocket): Endpoint;
    };

    /** Factory for local MessageChannel-backed Cmd<T> transports. */
    export type LocalFactory = <
      N extends string,
      P extends Payload.Map<N>,
      R extends Result.Map<N>,
      E extends Event.Map<N> = Event.Map<N>,
    >(
      input: LocalInput<N, P, R, E>,
    ) => LocalTransport;

    /** Input for creating a local MessageChannel-backed Cmd<T> transport. */
    export type LocalInput<
      N extends string,
      P extends Payload.Map<N>,
      R extends Result.Map<N>,
      E extends Event.Map<N> = Event.Map<N>,
    > = {
      /** Typed Cmd<T> factory to host. */
      readonly factory: Cmd.Factory<N, P, R, E>;
      /** Host-side command handlers. */
      readonly handlers: Handler.Map<N, P, R, E>;
      /** Optional host options. The transport still owns explicit MessagePort closure. */
      readonly hostOptions?: Host.Options;
    };

    /** Local MessageChannel-backed Cmd<T> transport. */
    export type LocalTransport = t.DisposableLike & {
      /** Client-side endpoint to pass into a Cmd<T> client. */
      readonly endpoint: Endpoint;
      /** Host lifecycle bound to the transport handlers. */
      readonly host: Host.Handle;
    };

    /** Minimal MessagePort-like type. */
    export type MessagePort = {
      postMessage: (data: unknown) => void;
      addEventListener: (type: 'message', handler: (event: { data: unknown }) => void) => void;
      start?: () => void;
      close?: () => void;
    };
  }

  /** Command factory constructor contract. */
  export namespace Make {
    /** Options passed to `Cmd.make()`. */
    export type Options = {
      /** Optional namespace used to disambiguate shared transports. */
      ns?: Namespace;
    };

    /** Factory for creating typed command factories. */
    export type Factory = <
      N extends string = Name,
      P extends Payload.Map<N> = Payload.Map<N>,
      R extends Result.Map<N> = Result.Map<N>,
      E extends Event.Map<N> = Event.Map<N>,
    >(
      opts?: Options,
    ) => Cmd.Factory<N, P, R, E>;
  }
}
