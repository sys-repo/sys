import { type t } from './common.ts';
import { pick } from './u.pick.ts';

/**
 * Generate a policy picker.
 */
export function policy(shards: t.ShardCount, strategy: t.ShardStrategy = 'prefix-range') {
  const policy: t.ShardPolicy = { shards, strategy };
  return {
    ...policy,
    pick: (sha256Hex: string) => pick(policy, sha256Hex),
  };
}
