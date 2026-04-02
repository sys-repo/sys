import { type t, SlugSchema } from './common.ts';
import { SlugTreeFs } from '@sys/model-slug/fs';
import { fromDag } from './u.fromDag.ts';
import { reindex } from './u.reindex.ts';
import { toYaml } from './u.toYaml.ts';

export * from './common.ts';

/** Helpers for building and rewriting slug trees. */
export const SlugTree: t.SlugTreeLib = {
  Schema: SlugSchema.Tree,
  fromDag,
  fromDir: SlugTreeFs.fromDir,
  reindex,
  toYaml,
};
