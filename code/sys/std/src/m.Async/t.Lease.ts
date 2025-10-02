import type { t } from './common.ts';

/**
 * Lease Library
 *
 * Provides "latest-wins" leases over arbitrary keys/tokens.
 * Only the most recent claimant for a given key is considered the owner.
 */
export type LeaseLib = {
  /**
   * Create a new in-memory LeaseMap.
   *
   * @example
   *    const lease = Lease.make<string>();
   *    const token = 'abc';
   *    lease.claim('editor-1', token);
   *    lease.isOwner('editor-1', token); // true
   */
  make<K, T extends string = string>(): LeaseMap<K, T>;

  /**
   * Rx guard operator: only allows events through if the given `token`
   * currently holds the lease for `key`.
   *
   * Usage:
   *   source$.pipe(Lease.guard(lease, key, token))
   */
  guard<K, T extends string = string, E = unknown>(
    lease: LeaseMap<K, T>,
    key: K,
    token: T,
  ): t.OperatorFunction<E, E>;
};

/**
 * A "latest-wins" lease over a key space.
 * Only the newest claimant for a given key holds the lease.
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
