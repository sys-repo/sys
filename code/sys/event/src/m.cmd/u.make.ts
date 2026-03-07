import { type t } from './common.ts';
import { makeClient } from './u.client.ts';
import { makeHost } from './u.host.ts';

/**
 * Create a typed command-bus instance for a concrete command set.
 */
export function make<
  N extends string = t.CmdName,
  P extends t.CmdPayloadMap<N> = t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N> = t.CmdPayloadResultMap<N>,
  E extends t.CmdPayloadEventMap<N> = t.CmdPayloadEventMap<N>,
>(opts: t.CmdMakeOptions = {}): t.CmdFactory<N, P, R, E> {
  const { ns } = opts;
  return {
    client(endpoint, clientOpts) {
      return makeClient<N, P, R, E>(endpoint, { ...clientOpts, ns });
    },
    host(endpoint, handlers) {
      return makeHost<N, P, R>(endpoint, handlers, { ns });
    },
  };
}
