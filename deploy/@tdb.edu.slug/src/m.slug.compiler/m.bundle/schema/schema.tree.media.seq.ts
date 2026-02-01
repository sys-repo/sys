import { Schema } from '../common.ts';
import { SchemaCrdtConfig } from './schema.crdt.ts';

export const SchemaSlugTreeMediaSeqBundleFields = {
  crdt: SchemaCrdtConfig,
  target: Schema.Type.Optional(
    Schema.Type.Object(
      {
        manifests: Schema.Type.Optional(
          Schema.Type.Object(
            {
              base: Schema.Type.Optional(Schema.Type.String()),
              hrefBase: Schema.Type.Optional(Schema.Type.String()),
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
              video: Schema.Type.Optional(
                Schema.Type.Object(
                  {
                    base: Schema.Type.Optional(Schema.Type.String()),
                    hrefBase: Schema.Type.Optional(Schema.Type.String()),
                    dir: Schema.Type.Optional(Schema.Type.String()),
                  },
                  { additionalProperties: false },
                ),
              ),
              image: Schema.Type.Optional(
                Schema.Type.Object(
                  {
                    base: Schema.Type.Optional(Schema.Type.String()),
                    hrefBase: Schema.Type.Optional(Schema.Type.String()),
                    dir: Schema.Type.Optional(Schema.Type.String()),
                  },
                  { additionalProperties: false },
                ),
              ),
            },
            { additionalProperties: false },
          ),
        ),
      },
      { additionalProperties: false },
    ),
  ),
  requirePlayback: Schema.Type.Optional(Schema.Type.Boolean()),
} as const;

export const SchemaSlugTreeMediaSeqBundle = Schema.Type.Object(SchemaSlugTreeMediaSeqBundleFields, {
  additionalProperties: false,
});
