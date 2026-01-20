import { type t } from './common.ts';

import { SlugTreeItemSchema, SlugTreePropsSchema } from './u.schema.ts';
import { validateSlugTree as validate } from './u.validate.ts';

export const SlugTreeSchema: t.SlugTreeSchemaLib = {
  Item: SlugTreeItemSchema,
  Props: SlugTreePropsSchema,
  validate,
};
