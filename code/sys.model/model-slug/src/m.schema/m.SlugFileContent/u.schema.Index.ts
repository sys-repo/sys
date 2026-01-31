import type { t } from '../common.ts';
import { Type } from '../common.ts';
import { SlugFileContentEntrySchema } from './u.schema.Entry.ts';
import { DocId } from './u.schema.parts.ts';

const SlugFileContentIndexSchemaInternal = Type.Object(
  {
    docid: DocId,
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
