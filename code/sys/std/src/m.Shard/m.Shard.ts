import { type t } from './common.ts';
import { Sha256 } from './m.Sha256.ts';
import { pick } from './u.pick.ts';
import { policy } from './u.policy.ts';

export const Shard: t.ShardLib = {
  pick,
  policy,
  Sha256,
};
