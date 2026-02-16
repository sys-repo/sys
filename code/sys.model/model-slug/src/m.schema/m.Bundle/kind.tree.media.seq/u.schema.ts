import type { t } from './common.ts';
import { Type } from './common.ts';
import { BundleDescriptorBaseFields } from '../u.schema.core.ts';

const Dir = Type.String({ description: 'Directory name relative to base path.' });
const Path = Type.String({ description: 'Relative file path.' });
const ShardPolicy = Type.Object(
  {
    strategy: Type.Literal('prefix-range'),
    total: Type.Number(),
    host: Type.Optional(Type.Union([Type.Literal('prefix-shard'), Type.Literal('none')])),
    path: Type.Optional(Type.Union([Type.Literal('preserve'), Type.Literal('root-filename')])),
  },
  { additionalProperties: false },
);
const LayoutShard = Type.Object(
  {
    video: Type.Optional(ShardPolicy),
    image: Type.Optional(ShardPolicy),
  },
  { additionalProperties: false },
);

const LayoutMedia = Type.Object(
  {
    manifestsDir: Type.Optional(Dir),
    mediaDirs: Type.Optional(
      Type.Object(
        {
          video: Type.Optional(Dir),
          image: Type.Optional(Dir),
        },
        { additionalProperties: false },
      ),
    ),
    shard: Type.Optional(LayoutShard),
  },
  { additionalProperties: false },
);

const MediaFiles = Type.Object(
  {
    assets: Type.Optional(Path),
    playback: Type.Optional(Path),
    tree: Type.Optional(Path),
  },
  { additionalProperties: false },
);

export const BundleDescriptorSlugTreeMediaSeqSchema: t.TSchema = Type.Object(
  {
    ...BundleDescriptorBaseFields,
    kind: Type.Literal('slug-tree:media:seq'),
    layout: Type.Optional(LayoutMedia),
    files: Type.Optional(MediaFiles),
  },
  { additionalProperties: false },
);

export { LayoutMedia, MediaFiles, LayoutShard };
