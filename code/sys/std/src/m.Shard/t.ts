import type { t } from './common.ts';

/** Number of shards available for prefix-range bucketing. */
export type ShardCount = number;

/** Shard index within the range [0..ShardCount-1]. */
export type ShardIndex = number;

/** Strategy discriminator for prefix-range bucketing. */
export type ShardStrategy = 'prefix-range';

/**
 * Deterministic, provider-agnostic sharding for sha256 content IDs.
 * Pure math + validation only: given a sha256 hex string and shard count,
 * returns a stable shard index via prefix-range bucketing.
 */
export type ShardLib = {
  /** Deterministically select a shard index using prefix-range bucketing. */
  pick(policy: ShardPolicy, sha256Hex: string): ShardIndex;

  /** SHA256 helpers. */
  readonly Sha256: ShardSha256Lib;
};

/** SHA256 helpers */
export type ShardSha256Lib = {
  /**
   * Normalize sha256 hex strings.
   * Accepts "sha256-<hex64>" or "<hex64>".
   * Returns "<hex64>" in lower-case.
   */
  normalizeHex(input: string): Sha256Hex;
};

/** Policy for deterministic prefix-range sharding. */
export type ShardPolicy = {
  readonly shards: ShardCount;
  readonly strategy: ShardStrategy;
};

/** Lower-case, validated sha256 hex string (64 chars). */
export type Sha256Hex = string & { readonly __sha256_hex: 'Sha256Hex' };
