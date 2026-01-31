import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { SlugFileContentIndexSchema as Index, SlugFileContentSchema as Props } from './u.schema.ts';
import { validate } from './u.validate.ts';

export const SlugFileContentSchema: t.SlugFileContentSchemaLib = {
  Is,
  Index,
  Props,
  validate,
};
