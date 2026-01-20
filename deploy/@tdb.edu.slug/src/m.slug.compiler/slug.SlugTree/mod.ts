import { type t, SlugTreeSchema as Schema } from './common.ts';
import { fromDag } from './u.fromDag.ts';

export const SlugTree: t.SlugTreeLib = {
  Schema,
  fromDag,
};
