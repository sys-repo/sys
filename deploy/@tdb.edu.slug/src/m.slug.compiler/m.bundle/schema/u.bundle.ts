import { Schema } from '../common.ts';
import { SchemaSlugTreeFsFields } from './u.tree.fs.ts';
import { SchemaSlugTreeMediaSeqBundleFields } from './u.tree.media.seq.ts';

export const SchemaBundleEntry = Schema.Type.Union([
  Schema.Type.Object(
    {
      kind: Schema.Type.Literal('slug-tree:fs'),
      ...SchemaSlugTreeFsFields,
    },
    { additionalProperties: false },
  ),
  Schema.Type.Object(
    {
      kind: Schema.Type.Literal('slug-tree:media:seq'),
      ...SchemaSlugTreeMediaSeqBundleFields,
    },
    { additionalProperties: false },
  ),
]);

export const SchemaBundleConfig = Schema.Type.Object(
  {
    bundles: Schema.Type.Array(SchemaBundleEntry, { minItems: 0 }),
  },
  { additionalProperties: false },
);
