/**
 * @module Lease/Mutex Library
 *
 * Provides "latest-wins" leases over arbitrary keys/tokens.
 * Only the most recent claimant for a given key is considered the owner.
 */
export { Lease } from './m.Lease.ts';
