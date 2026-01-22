import { type t, SlugSchema } from './common.ts';
import { fromDag } from './u.fromDag.ts';

export const SlugTree: t.SlugTreeLib = {
  Schema: SlugSchema.Tree,
  fromDag,
};
