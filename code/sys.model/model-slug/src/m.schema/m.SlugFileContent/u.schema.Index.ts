import type { t } from '../common.ts';
import { Type } from '../common.ts';
import { SlugFileContentEntrySchema } from './u.schema.Entry.ts';

const SlugFileContentIndexSchemaInternal = Type.Object(
  {
    entries: Type.Array(SlugFileContentEntrySchema, {
      description: 'Slug file content index entries.',
    }),
  },
  {
    additionalProperties: false,
    description: 'Slug file content index.',
    title: 'Slug File Content Index',
  },
);

export const SlugFileContentIndexSchema: t.TSchema = SlugFileContentIndexSchemaInternal;
