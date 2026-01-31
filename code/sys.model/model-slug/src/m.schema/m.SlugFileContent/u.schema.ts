import type { t } from '../common.ts';
import { Type } from '../common.ts';

const Source = Type.String({
  description: 'Content source payload (eg. markdown).',
});
const Hash = Type.String({
  minLength: 1,
  description: 'SHA256 hash of the source payload.',
});
const ContentType = Type.String({
  minLength: 1,
  description: 'MIME content type for the source payload.',
});
const Path = Type.String({
  description: 'Optional relative source path.',
});

const SlugFileContentSchemaInternal = Type.Object(
  {
    source: Source,
    hash: Hash,
    contentType: ContentType,
    path: Type.Optional(Path),
  },
  {
    additionalProperties: false,
    description: 'Slug file content document.',
    title: 'Slug File Content',
  },
);

export const SlugFileContentSchema: t.TSchema = SlugFileContentSchemaInternal;
