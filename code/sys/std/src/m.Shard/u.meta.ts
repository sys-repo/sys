import { type t } from './common.ts';
import { pick } from './u.pick.ts';

/** Build canonical shard metadata for downstream consumers. */
export function meta(policy: t.ShardPolicy, sha256Hex: string): t.ShardMeta {
  return {
    strategy: policy.strategy,
    total: policy.shards,
    index: pick(policy, sha256Hex),
  };
}

