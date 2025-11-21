import { type t } from './common.ts';
import { createClient } from './u.createClient.ts';
import { createHost } from './u.createHost.ts';

/**
 * Create a typed command-bus instance for a concrete command set.
 */
export function make<
  N extends string = t.CmdName,
  P extends t.CmdPayloadMap<N> = t.CmdPayloadMap<N>,
  R extends t.CmdPayloadResultMap<N> = t.CmdPayloadResultMap<N>,
>(): t.CmdInstance<N, P, R> {
  return {
    client: (endpoint) => createClient<N, P, R>(endpoint),
    host: (endpoint, handlers) => createHost<N, P, R>(endpoint, handlers),
  };
}
