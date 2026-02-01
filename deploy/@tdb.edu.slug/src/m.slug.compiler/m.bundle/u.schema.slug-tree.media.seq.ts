import { Schema } from './common.ts';
import { SchemaCrdtConfig } from './u.schema.crdt.ts';

export const SchemaSlugTreeMediaSeqBundle = Schema.Type.Optional(
  Schema.Type.Object(
    {
      crdt: SchemaCrdtConfig,
      target: Schema.Type.Optional(
        Schema.Type.Object(
          {
            base: Schema.Type.Optional(Schema.Type.String()),
            hrefBase: Schema.Type.Optional(Schema.Type.String()),
            manifests: Schema.Type.Optional(
              Schema.Type.Object(
                {
                  dir: Schema.Type.Optional(Schema.Type.String()),
                  assets: Schema.Type.Optional(Schema.Type.String()),
                  playback: Schema.Type.Optional(Schema.Type.String()),
                  tree: Schema.Type.Optional(Schema.Type.String()),
                },
                { additionalProperties: false },
              ),
            ),
            media: Schema.Type.Optional(
              Schema.Type.Object(
                {
                  video: Schema.Type.Optional(Schema.Type.String()),
                  image: Schema.Type.Optional(Schema.Type.String()),
                },
                { additionalProperties: false },
              ),
            ),
          },
          { additionalProperties: false },
        ),
      ),
      requirePlayback: Schema.Type.Optional(Schema.Type.Boolean()),
    },
    { additionalProperties: false },
  ),
);
