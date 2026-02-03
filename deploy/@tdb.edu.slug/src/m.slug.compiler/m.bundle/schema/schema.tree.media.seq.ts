import { Schema } from '../common.ts';
import { SchemaCrdtConfig } from './schema.crdt.ts';

const MediaShard = Schema.Type.Object(
  {
    strategy: Schema.Type.Optional(Schema.Type.Literal('prefix-range')),
    total: Schema.Type.Number(),
  },
  { additionalProperties: false },
);

const MediaItem = Schema.Type.Object(
  {
    base: Schema.Type.Optional(Schema.Type.String()),
    hrefBase: Schema.Type.Optional(Schema.Type.String()),
    dir: Schema.Type.Optional(Schema.Type.String()),
    shard: Schema.Type.Optional(MediaShard),
  },
  { additionalProperties: false },
);

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
              video: Schema.Type.Optional(MediaItem),
              image: Schema.Type.Optional(MediaItem),
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
