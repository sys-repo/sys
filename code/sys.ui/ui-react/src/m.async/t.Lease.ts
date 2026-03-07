import type { LeaseLib as StdLeaseLib } from '@sys/std/t';
import type { t } from './common.ts';

type S = string;

/**
 * Lease Library (React extensions).
 *
 * Provides "latest-wins" leases over arbitrary keys/tokens.
 * Only the most recent claimant for a given key is considered the owner.
 */
export type LeaseLib = StdLeaseLib & {
  /**
   * Create a React hook bound to a singleton lease instance.
   *
   * @example
   *    const lease = Lease.make<string>();
   *    const useLease = Lease.makeUseLease(lease);
   *    const token = 'abc';
   *    useLease('editor-1', token); // claims on mount, releases on unmount
   */
  makeUseLease: t.MakeUseLease;
};

/**
 * React hook factory for a "latest-wins" lease.
 * Produces a hook that claims a lease on mount and releases on unmount.
 */
export type MakeUseLease = <K, T extends S = S>(lease: t.LeaseMap<K, T>) => UseLeaseHook<K, T>;
/** The hook returned by `CreateUseLease`. */
export type UseLeaseHook<K, T extends S = S> = (key: K | undefined, token: T) => void;
