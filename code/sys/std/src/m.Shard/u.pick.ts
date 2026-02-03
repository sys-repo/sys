import type { t } from './common.ts';
import { Sha256 } from './m.Sha256.ts';

/**
 * Deterministically select a shard index using prefix-range bucketing.
 */
export function pick(policy: t.ShardPolicy, sha256Hex: string): t.ShardIndex {
  const shards = policy?.shards;
  if (!Number.isInteger(shards) || shards <= 0) {
    throw new Error(`Invalid shard count: ${String(shards)}`);
  }

  if (policy?.strategy !== 'prefix-range') {
    throw new Error(`Unsupported shard strategy: ${String(policy?.strategy)}`);
  }

  const hex = Sha256.normalizeHex(sha256Hex);
  const firstByte = Number.parseInt(hex.slice(0, 2), 16);
  const shard = Math.floor((firstByte * shards) / 256);
  return shard as t.ShardIndex;
}
