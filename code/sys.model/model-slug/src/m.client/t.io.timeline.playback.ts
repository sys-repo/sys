import { type t } from './common.ts';

/** Playback-manifest endpoint loaders. */
export type SlugClientPlaybackLib = {
  readonly load: <P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineManifest<P>>>;
};

/** Playback loaders scoped to a descriptor client. */
export type SlugClientPlaybackFromDescriptorLib = {
  readonly load: <P = unknown>(
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineManifest<P>>>;
};

/** Timeline bundle endpoint loaders. */
export type SlugClientTimelineBundleLib = {
  readonly load: <P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugTimelineBundleLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineBundle<P>>>;
};

/** Timeline bundle loaders scoped to a descriptor client. */
export type SlugClientTimelineBundleFromDescriptorLib = {
  readonly load: <P = unknown>(
    options?: t.SlugTimelineBundleLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineBundle<P>>>;
};

/** Options for loading a timeline bundle. */
export type SlugTimelineBundleLoadOptions = t.SlugLoadOptions & {
  hrefResolver?: SlugTimelineBundleHrefResolver;
};

/** Href resolver for timeline bundle assets. */
export type SlugTimelineBundleHrefResolver =
  t.SlugBundleHrefResolver<t.BundleDescriptorSlugTreeMediaSeqAssetKind>;
