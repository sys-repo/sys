import { type t, SlugTreeItemSchema, SlugTreePropsSchema, validateSlugTree } from './common.ts';
import { fromDag } from './u.fromDag.ts';

export const SlugTree: t.SlugTreeLib = {
  Schema: { Item: SlugTreeItemSchema, Props: SlugTreePropsSchema },
  validate: validateSlugTree,
  fromDag,
};
