import { Schema } from '../common.ts';
import { SchemaSlugDocYamlBundleFields } from './schema.slug.doc.yaml.ts';
import { SchemaSlugTreeFsFields } from './schema.tree.fs.ts';
import { SchemaSlugTreeMediaSeqBundleFields } from './schema.tree.media.seq.ts';

export const SchemaBundleBaseFields = {
  enabled: Schema.Type.Optional(Schema.Type.Boolean()),
} as const;

export const SchemaBundleEntry = Schema.Type.Union([
  Schema.Type.Object(
    {
      kind: Schema.Type.Literal('slug-tree:fs'),
      ...SchemaBundleBaseFields,
      ...SchemaSlugTreeFsFields,
    },
    { additionalProperties: false },
  ),
  Schema.Type.Object(
    {
      kind: Schema.Type.Literal('slug-tree:media:seq'),
      ...SchemaBundleBaseFields,
      ...SchemaSlugTreeMediaSeqBundleFields,
    },
    { additionalProperties: false },
  ),
  Schema.Type.Object(
    {
      kind: Schema.Type.Literal('slug:fs:yaml'),
      ...SchemaBundleBaseFields,
      ...SchemaSlugDocYamlBundleFields,
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
