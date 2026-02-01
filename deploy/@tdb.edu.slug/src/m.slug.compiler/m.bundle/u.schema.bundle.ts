import { Schema } from './common.ts';
import { SchemaSlugTreeFs, SchemaSlugTreeMediaSeqBundle } from './u.schema.slug-tree.ts';

export const SchemaBundleConfig = Schema.Type.Object(
  {
    'bundle:slug-tree:fs': SchemaSlugTreeFs,
    'bundle:slug-tree:media:seq': SchemaSlugTreeMediaSeqBundle,
  },
  { additionalProperties: false },
);
