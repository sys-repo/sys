import type { t } from './common.ts';

/** Media types emitted in a slug bundle. */
export type SlugAssetKind = 'video' | 'image';

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
export type SequenceFilepathBundleResult = t.SequenceFilepathLintResult & {
  readonly dir: {
    readonly base: t.StringDir;
    readonly manifests: t.StringDir;
    readonly video: t.StringDir;
    readonly image: t.StringDir;
  };
};

/**
 * Callback invoked for each media path discovered in a slug.
 */
export type SlugMediaWalkVisitor = (args: SlugMediaWalkArgs) => void | Promise<void>;
/** A single media-path observation during a slug walk. */
export type SlugMediaWalkArgs = {
  readonly kind: t.SlugAssetKind; // 'video' | 'image'
  readonly raw: string; // Original value from YAML
  readonly resolvedPath: string; // Concrete path after alias + tilde resolution
  readonly exists: boolean; // Whether the file exists on disk
  readonly error?: unknown; // Resolution error, if any
};
