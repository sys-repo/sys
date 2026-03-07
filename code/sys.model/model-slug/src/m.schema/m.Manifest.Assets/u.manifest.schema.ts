import { type t, Schema } from './common.ts';

export const schema: t.SlugAssetsManifestSchemaLib['schema'] = () => {
  const Type = Schema.Type;
  const DocId = Type.Unsafe<t.StringId>(Type.String());
  const StringPath = Type.Unsafe<t.StringPath>(Type.String());
  const Msecs = Type.Unsafe<t.Msecs>(Type.Number());

  const AssetStats = Type.Object(
    {
      bytes: Type.Optional(Type.Number()),
      duration: Type.Optional(Msecs),
    },
    { additionalProperties: false },
  );

  const AssetShard = Type.Object(
    {
      strategy: Type.Literal('prefix-range'),
      total: Type.Number(),
      index: Type.Number(),
    },
    { additionalProperties: false },
  );

  const Asset = Type.Object(
    {
      kind: Type.Union([Type.Literal('video'), Type.Literal('image')]),
      logicalPath: StringPath,
      hash: Type.String(),
      filename: Type.String(),
      href: Type.String(),
      shard: Type.Optional(AssetShard),
      stats: Type.Optional(AssetStats),
    },
    { additionalProperties: false },
  );

  return Type.Object(
    {
      docid: DocId,
      assets: Type.Array(Asset),
    },
    { additionalProperties: false },
  );
};
