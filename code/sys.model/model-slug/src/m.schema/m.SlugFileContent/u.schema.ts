import type { t } from '../common.ts';
import { Type } from '../common.ts';
import { SlugFileContentEntrySchema } from './u.schema.Entry.ts';
import { SlugFileContentIndexSchema } from './u.schema.Index.ts';
import { ContentType, Frontmatter, Hash, Path } from './u.schema.parts.ts';

const Source = Type.String({ description: 'Content source payload (eg. markdown).' });

const SlugFileContentSchemaInternal = Type.Object(
  {
    source: Source,
    hash: Hash,
    contentType: ContentType,
    frontmatter: Frontmatter,
    path: Type.Optional(Path),
  },
  {
    additionalProperties: false,
    description: 'Slug file content document.',
    title: 'Slug File Content',
  },
);

export const SlugFileContentSchema: t.TSchema = SlugFileContentSchemaInternal;
export { SlugFileContentEntrySchema, SlugFileContentIndexSchema };
