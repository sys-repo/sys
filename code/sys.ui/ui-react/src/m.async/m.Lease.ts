import { Lease as StdLease } from '@sys/std/async';

import { type t } from './common.ts';
import { makeUseLease } from './use.Lease.ts';

/**
 * Lease Library (React extensions).
 *
 * Provides "latest-wins" leases over arbitrary keys/tokens.
 * Only the most recent claimant for a given key is considered the owner.
 */
export const Lease: t.LeaseLib = {
  ...StdLease,
  makeUseLease,
};
