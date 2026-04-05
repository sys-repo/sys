import { type t } from './common.ts';
import { create } from './u.create.ts';
import { fromDataset } from './u.dataset.ts';
import { loadMounts } from './u.mounts.ts';
import { findHash, refsFromTree, selectOrFirst } from './u.refs.ts';

export const SlcDataClient: t.SlcDataClient.Lib = {
  Mounts: { load: loadMounts },
  create,
  fromDataset,
  refsFromTree,
  findHash,
  selectOrFirst,
};
