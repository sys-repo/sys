import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { SlugTreeItemSchema as Item, SlugTreePropsSchema as Props } from './u.schema.ts';
import { validate } from './u.validate.ts';

export const SlugTreeSchema: t.SlugTreeSchemaLib = {
  Is,
  Item,
  Props,
  validate,
};
