import { Schema } from '../common.ts';
import { SchemaCrdtConfig } from './schema.crdt.ts';

export const SchemaSlugDocYamlBundleFields = {
  crdt: SchemaCrdtConfig,
  target: Schema.Type.Object(
    {
      dir: Schema.Type.String(),
      filenames: Schema.Type.Optional(
        Schema.Type.Object(
          {
            mode: Schema.Type.Optional(Schema.Type.Literal('docid')),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
} as const;

export const SchemaSlugDocYamlBundle = Schema.Type.Object(SchemaSlugDocYamlBundleFields, {
  additionalProperties: false,
});
