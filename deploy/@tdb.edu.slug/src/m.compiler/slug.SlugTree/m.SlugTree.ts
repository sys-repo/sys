import type { t } from './common.ts';
import { fromDag } from './u.fromDag.ts';
import { SlugTreePropsSchema, SlugTreeItemSchema } from './u.schema.ts';
import { validateSlugTree } from './u.validate.ts';

export const SlugTree: t.SlugTreeLib = {
  Schema: {
    Item: SlugTreeItemSchema,
    Props: SlugTreePropsSchema,
  },
  validate: validateSlugTree,
  fromDag,
};
