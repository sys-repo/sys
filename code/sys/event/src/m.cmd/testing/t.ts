import type { t } from './common.ts';

/**
 * Test fixtures for Cmd<T> transports.
 */
export declare namespace CmdFixture {
  /** Runtime library surface for Cmd<T> test fixtures. */
  export type Lib = {
    /** Create a local Cmd<T> host bound to one side of a MessageChannel. */
    localTransport: LocalTransportFactory;
  };

  /** Factory for local MessageChannel-backed Cmd<T> transport fixtures. */
  export type LocalTransportFactory = <
    N extends string,
    P extends t.Cmd.Payload.Map<N>,
    R extends t.Cmd.Result.Map<N>,
    E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
  >(
    input: LocalTransportInput<N, P, R, E>,
  ) => LocalTransport;

  /** Input for creating a local MessageChannel-backed Cmd<T> transport fixture. */
  export type LocalTransportInput<
    N extends string,
    P extends t.Cmd.Payload.Map<N>,
    R extends t.Cmd.Result.Map<N>,
    E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
  > = {
    /** Typed Cmd<T> factory to host. */
    readonly factory: t.Cmd.Factory<N, P, R, E>;
    /** Host-side command handlers. */
    readonly handlers: t.Cmd.Handler.Map<N, P, R, E>;
    /** Optional host options. The fixture still owns explicit MessagePort closure. */
    readonly hostOptions?: t.Cmd.Host.Options;
  };

  /** Local MessageChannel-backed Cmd<T> transport fixture. */
  export type LocalTransport = t.DisposableLike & {
    /** Client-side endpoint to pass into the API under test. */
    readonly endpoint: t.Cmd.Endpoint;
    /** Host lifecycle bound to the fixture handlers. */
    readonly host: t.Cmd.Host.Handle;
  };
}
