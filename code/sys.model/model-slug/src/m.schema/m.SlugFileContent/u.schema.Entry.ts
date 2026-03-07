import type { t } from '../common.ts';
import { Type } from '../common.ts';
import { ContentType, Frontmatter, Hash, Path } from './u.schema.parts.ts';

const SlugFileContentEntrySchemaInternal = Type.Object(
  {
    hash: Hash,
    contentType: ContentType,
    frontmatter: Frontmatter,
    path: Type.Optional(Path),
  },
  {
    additionalProperties: false,
    description: 'Slug file content entry (index item).',
    title: 'Slug File Content Entry',
  },
);

export const SlugFileContentEntrySchema: t.TSchema = SlugFileContentEntrySchemaInternal;
