import { type t, SlugSchema } from './common.ts';
import { fromDag } from './u.fromDag.ts';
import { fromDir } from './u.fromDir.ts';
import { reindex } from './u.reindex.ts';
import { toYaml } from './u.toYaml.ts';

export const SlugTree: t.SlugTreeLib = {
  Schema: SlugSchema.Tree,
  fromDag,
  fromDir,
  reindex,
  toYaml,
};
