import { type t, Rx } from './common.ts';

export function guard<K, T extends string = string, E = unknown>(
  lease: t.LeaseMap<K, T>,
  key: K,
  token: T,
): t.OperatorFunction<E, E> {
  return Rx.filter(() => lease.isOwner(key, token));
}
