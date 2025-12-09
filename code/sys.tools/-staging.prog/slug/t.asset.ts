import type { t } from './common.ts';

/** Media types emitted in a slug bundle. */
export type SlugAssetKind = t.PlaybackMediaKind;

/** A single bundled asset with its hashed filename and resolved href. */
export type SlugAsset = {
  readonly kind: t.SlugAssetKind;
  readonly logicalPath: t.StringPath;
  readonly hash: t.StringHash;
  readonly filename: t.StringName;
  readonly href: string;
};

/** Manifest describing all bundled assets for one document. */
export type SlugAssetsManifest = {
  readonly docid: t.Crdt.Id;
  readonly assets: SlugAsset[];
};

/** Result of bundling: lint issues plus optional manifest location. */
export type SequenceFilepathBundleResult = t.LintSequenceFilepathResult & {
  readonly dir: {
    readonly base: t.StringDir;
    readonly manifests: t.StringDir;
    readonly video: t.StringDir;
    readonly image: t.StringDir;
  };
};
