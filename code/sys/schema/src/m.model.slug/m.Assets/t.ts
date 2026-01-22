import type { t } from './common.ts';

export type SlugAssetsSchemaLib = {
  readonly Manifest: SlugAssetsManifestSchemaLib;
};

export type SlugAssetsManifestSchemaLib = {
  readonly schema: (args?: never) => t.TSchema;
  readonly standard: (args?: never) => t.StandardSchemaV1<unknown, AssetsManifest>;
  readonly parse: (input: unknown, args?: never) => t.SchemaResult<AssetsManifest>;
};

export type AssetKind = 'video' | 'image';

export type AssetsManifest = {
  readonly docid: t.StringId;
  readonly assets: readonly Asset[];
};

export type Asset = {
  readonly kind: AssetKind;
  readonly logicalPath: t.StringPath;
  readonly hash: string;
  readonly filename: string;
  readonly href: string;
  readonly stats?: {
    readonly bytes?: number;
    readonly duration?: t.Msecs;
  };
};
