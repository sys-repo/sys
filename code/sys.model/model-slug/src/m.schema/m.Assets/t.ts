import type { t } from './common.ts';

export type SlugAssetsSchemaLib = {
  readonly Manifest: SlugAssetsManifestSchemaLib;
};

export type SlugAssetsManifestSchemaLib = {
  readonly schema: (args?: never) => t.TSchema;
  readonly standard: (args?: never) => t.StandardSchemaV1<unknown, t.SlugAssetsManifest>;
  readonly parse: (input: unknown, args?: never) => t.SchemaResult<t.SlugAssetsManifest>;
};

export type SlugAssetsManifest = {
  readonly docid: t.StringId;
  readonly assets: readonly SlugAsset[];
};

export type SlugAssetKind = 'video' | 'image';
export type SlugAsset = {
  readonly kind: SlugAssetKind;
  readonly logicalPath: t.StringPath;
  readonly hash: string;
  readonly filename: string;
  readonly href: string;
  readonly stats?: {
    readonly bytes?: t.NumberBytes;
    readonly duration?: t.Msecs;
  };
};
