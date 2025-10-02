import type { t } from './common.ts';

/**
 * Lease library entry points.
 */
export type LeaseLib = {
  /** Create a new in-memory lease map. */
  make<K, T extends string = string>(): LeaseMap<K, T>;

  /** Rx operator: only allow events through if `token` currently holds the lease for `key`. */
  guard<K, T extends string = string, E = unknown>(
    lease: LeaseMap<K, T>,
    key: K,
    token: T,
  ): t.OperatorFunction<E, E>;
};

/**
 * "Latest-wins" lease over a key space.
 */
export type LeaseMap<K, T extends string = string> = {
  /** Number of keys currently claimed. */
  readonly size: number;

  /** Claim ownership of a key with the given token (replaces any prior owner). */
  claim(key: K, token: T): void;

  /** Release ownership, but only if the given token still holds it. */
  release(key: K, token: T): void;

  /** True if this token is the current lease-holder for the key. */
  isOwner(key: K, token: T): boolean;

  /** The current token holding the lease for this key, or undefined if none. */
  current(key: K): T | undefined;
};
