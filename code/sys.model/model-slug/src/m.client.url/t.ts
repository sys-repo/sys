import type { t } from './common.ts';

/**
 * Helpers for slug URL and filename derivation.
 */
export type SlugUrlLib = {
  readonly Composition: t.SlugUrlCompositionLib;
  readonly Util: t.SlugUrlUtilLib;

  readonly assetsFilename: (docid: t.StringId) => string;
  readonly treeAssetsFilename: (docid: t.StringId) => string;
  readonly playbackFilename: (docid: t.StringId) => string;
  readonly treeFilename: (docid: t.StringId) => string;
  readonly fileContentFilename: (hash: string) => string;
};

/**
 * URL composition helpers for endpoint fetch and shard rewrite policy.
 */
export type SlugUrlCompositionLib = {
  readonly manifestsLocation: (
    baseUrl: t.StringUrl,
    options?: t.SlugLoadOptions,
  ) => ManifestsLocation;
  readonly contentLocation: (baseUrl: t.StringUrl, options?: t.SlugLoadOptions) => ContentLocation;
  readonly manifests: (args: ManifestsArgs) => string;
  readonly content: (args: ContentArgs) => string;
  readonly descriptor: (args: DescriptorArgs) => string;
  readonly rewriteShardHost: (args: RewriteShardHostArgs) => string;
};

type ManifestsLocation = { readonly baseUrl: t.StringUrl; readonly manifestsDir: t.StringDir };
type ContentLocation = { readonly baseUrl: t.StringUrl; readonly contentDir: t.StringDir };
type ManifestsArgs = { baseUrl: t.StringUrl; manifestsDir: t.StringDir; filename: string };
type ContentArgs = { baseUrl: t.StringUrl; contentDir: t.StringDir; filename: string };
type DescriptorArgs = { origin: t.StringUrl; manifests: t.StringPath; filename: string };
type RewriteShardHostArgs = {
  href: string;
  asset: t.SpecTimelineAsset;
  layout?: t.SlugClientLayout;
};

/**
 * Common Slug-url helpers.
 */
export type SlugUrlUtilLib = {
  cleanDocid(docid: t.StringId): t.StringId;
};
