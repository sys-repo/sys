import type { t } from './common.ts';

/**
 * Namespace-style library surface for the command bus.
 * The implementation in `m.Cmd/mod.ts` should satisfy this shape.
 *
 * Call `Cmd.make<N,P,R>()` to obtain a typed instance for a concrete
 * command set (e.g. worker commands in @sys/driver-automerge).
 */
export type CmdLib = {
  make<
    N extends string = t.CmdName,
    P extends t.CmdPayloadMap<N> = t.CmdPayloadMap<N>,
    R extends t.CmdPayloadResultMap<N> = t.CmdPayloadResultMap<N>,
  >(): t.CmdInstance<N, P, R>;
};

/**
 * Typed instance for a concrete command set:
 * - N: command names
 * - P: payloads per name
 * - R: result payloads per name
 */
export type CmdInstance<
  N extends string,
  P extends t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N>,
> = {
  client(endpoint: t.CmdEndpoint): t.CmdClient<N, P, R>;
  host(endpoint: t.CmdEndpoint, handlers: t.CmdHandlers<N, P, R>): t.CmdHost;
};
