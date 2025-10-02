import { type t, Rx } from './common.ts';

/**
 * Library for managing "latest-wins" ownership leases over keys.
 */
export const Lease: t.LeaseLib = {
  guard,
  make,
};

/**
 * Rx operator: pass events only if `token` currently holds the lease for `key`.
 */
export function guard<K, T extends string = string, E = unknown>(
  lease: t.LeaseMap<K, T>,
  key: K,
  token: T,
) {
  return Rx.filter<E>(() => lease.isOwner(key, token));
}

/**
 * Create a new in-memory "latest-wins" lease map.
 */
export function make<K, T extends string = string>(): t.LeaseMap<K, T> {
  const map = new Map<K, T>();
  return {
    get size() {
      return map.size;
    },
    claim(key, token) {
      map.set(key, token);
    },
    release(key, token) {
      if (map.get(key) === token) map.delete(key);
    },
    isOwner(key, token) {
      return map.get(key) === token;
    },
    current(key) {
      return map.get(key);
    },
  };
}
