import type { t } from './common.ts';

/** Output directories used for slug asset bundles. */
export type SlugAssetsDirs = {
  readonly base: t.StringDir;
  readonly manifests: t.StringDir;
  readonly video: t.StringDir;
  readonly image: t.StringDir;
};

/** Result of writing an assets manifest for a document. */
export type SlugAssetsBundle = {
  readonly manifest: t.SlugAssetsManifest;
  readonly dir: SlugAssetsDirs;
};
