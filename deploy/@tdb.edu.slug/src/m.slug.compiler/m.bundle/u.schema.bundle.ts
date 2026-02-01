import { Schema } from './common.ts';
import { SchemaSlugTreeFs, SchemaSlugTreeMediaSeqBundle } from './u.schema.slug-tree.ts';

export const SchemaBundleConfig = Schema.Type.Object(
  {
    'bundle:slug-tree:fs': Schema.Type.Optional(SchemaSlugTreeFs),
    'bundle:slug-tree:media:seq': Schema.Type.Optional(SchemaSlugTreeMediaSeqBundle),
  },
  { additionalProperties: false },
);
