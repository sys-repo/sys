import { type t } from './common.ts';
import { makeClient } from './u.client.ts';
import { makeHost } from './u.host.ts';

/**
 * Create a typed command-bus instance for a concrete command set.
 */
export function make<
  N extends string = t.Cmd.Name,
  P extends t.Cmd.Payload.Map<N> = t.Cmd.Payload.Map<N>,
  R extends t.Cmd.Result.Map<N> = t.Cmd.Result.Map<N>,
  E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>,
>(opts: t.Cmd.Make.Options = {}): t.Cmd.Factory<N, P, R, E> {
  const { ns } = opts;
  return {
    client(endpoint, clientOpts) {
      return makeClient<N, P, R, E>(endpoint, { ...clientOpts, ns });
    },
    host(endpoint, handlers, hostOpts) {
      return makeHost<N, P, R, E>(endpoint, handlers, { ...hostOpts, ns });
    },
  };
}
