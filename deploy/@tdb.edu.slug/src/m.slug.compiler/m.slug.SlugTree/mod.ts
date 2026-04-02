import { type t, SlugSchema, SlugTreeFs, SlugTreePure } from './common.ts';
import { fromDag } from './u.fromDag.ts';

export * from './common.ts';

/** Helpers for building and rewriting slug trees. */
export const SlugTree: t.SlugTreeLib = {
  Schema: SlugSchema.Tree,
  fromDag,
  fromDir: SlugTreeFs.fromDir,
  reindex: SlugTreePure.reindex,
  toYaml: SlugTreePure.toYaml,
};
