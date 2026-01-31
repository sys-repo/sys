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

/** Media types emitted in a slug bundle. */
export type SlugAssetKind = t.Timecode.Playback.MediaKind;

/** A single bundled asset with its hashed filename and resolved href. */
export type SlugAsset = {
  readonly kind: t.SlugAssetKind;
  readonly logicalPath: t.StringPath;
  readonly hash: t.StringHash;
  readonly filename: t.StringName;
  readonly href: string;

  /** Filesystem / media statistics (when known). */
  readonly stats?: {
    /** File size in bytes. */
    readonly bytes?: t.NumberBytes;
    /** Media duration (typically video or audio only). */
    readonly duration?: t.Msecs;
  };
};
