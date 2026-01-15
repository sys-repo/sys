import type { t } from './common.ts';

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
  readonly stats: {
    /** File size in bytes. */
    readonly bytes?: t.NumberBytes;
    /** Media duration (typically video or audio only). */
    readonly duration?: t.Msecs;
  };
};

/** Manifest describing all bundled assets for one document. */
export type SlugAssetsManifest = {
  readonly docid: t.Crdt.Id;
  readonly assets: readonly SlugAsset[];
};

/** Output directories used for slug asset bundles. */
export type SlugAssetsDirs = {
  readonly base: t.StringDir;
  readonly manifests: t.StringDir;
  readonly video: t.StringDir;
  readonly image: t.StringDir;
};

/** Result of writing an assets manifest for a document. */
export type SlugAssetsBundle = {
  readonly manifest: SlugAssetsManifest;
  readonly dir: SlugAssetsDirs;
};
