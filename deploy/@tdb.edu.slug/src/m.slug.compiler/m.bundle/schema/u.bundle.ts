import { Schema } from '../common.ts';
import { SchemaSlugTreeFs } from './u.tree.fs.ts';
import { SchemaSlugTreeMediaSeqBundle } from './u.tree.media.seq.ts';

export const SchemaBundleConfig = Schema.Type.Object(
  {
    'bundle:slug-tree:fs': Schema.Type.Optional(SchemaSlugTreeFs),
    'bundle:slug-tree:media:seq': Schema.Type.Optional(SchemaSlugTreeMediaSeqBundle),
  },
  { additionalProperties: false },
);
