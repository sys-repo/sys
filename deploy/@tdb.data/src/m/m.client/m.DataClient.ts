import { type t } from './common.ts';
import { Mounts } from './m.Mounts.ts';
import { create } from './u.create.ts';
import { fromDataset } from './u.dataset.ts';
import { findHash, refsFromTree, selectOrFirst } from './u.refs.ts';

export const DataClient: t.SlugDataClient.Lib = {
  Mounts,
  create,
  fromDataset,
  refsFromTree,
  findHash,
  selectOrFirst,
};
