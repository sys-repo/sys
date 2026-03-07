/**
 * @module
 * Deterministic, provider-agnostic sharding for sha256 content IDs.
 * Pure math + validation only: given a sha256 hex string and shard count,
 * returns a stable shard index via prefix-range bucketing.
 */
export { Shard } from './m.Shard.ts';
