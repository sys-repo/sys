import { type t } from './common.ts';
import { makeClient } from './u.make.client.ts';
import { makeHost } from './u.make.host.ts';

/**
 * Create a typed command-bus instance for a concrete command set.
 */
export function make<
  N extends string = t.CmdName,
  P extends t.CmdPayloadMap<N> = t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N> = t.CmdPayloadResultMap<N>,
>(opts: t.CmdMakeOptions = {}): t.CmdInstance<N, P, R> {
  const { ns } = opts;
  return {
    client: (endpoint, opts) => makeClient<N, P, R>(endpoint, { ...opts, ns }),
    host: (endpoint, handlers) => makeHost<N, P, R>(endpoint, handlers, { ns }),
  };
}
