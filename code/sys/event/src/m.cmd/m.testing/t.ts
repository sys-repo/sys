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
  export type LocalTransportFactory = t.Cmd.Transport.LocalFactory;

  /** Input for creating a local MessageChannel-backed Cmd<T> transport fixture. */
  export type LocalTransportInput<
    N extends string,
    P extends t.Cmd.Payload.Map<N>,
    R extends t.Cmd.Result.Map<N>,
    E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
  > = t.Cmd.Transport.LocalInput<N, P, R, E>;

  /** Local MessageChannel-backed Cmd<T> transport fixture. */
  export type LocalTransport = t.Cmd.Transport.LocalTransport;
}
