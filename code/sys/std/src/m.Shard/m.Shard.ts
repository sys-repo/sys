import { type t } from './common.ts';
import { Sha256 } from './m.Sha256.ts';
import { pick } from './u.pick.ts';

export const Shard: t.ShardLib = {
  policy(shards, strategy = 'prefix-range') {
    return { shards, strategy };
  },
  pick,
  Sha256,
};
