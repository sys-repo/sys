import type { t } from './common.ts';

/**
 * Endpoint loaders:
 */
export type SlugLoadOptions = { init?: RequestInit; baseHref?: t.StringUrl };
export type SlugFromEndpointLib = {
  readonly Tree: t.SlugClientTreeLib;
  readonly Playback: t.SlugClientPlaybackLib;
  readonly Assets: t.SlugClientAssetsLib;
  readonly Bundle: t.SlugClientBundleLib;
};

export type SlugClientTreeLib = {
  readonly load: (
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugTreeItems>>;
};

export type SlugClientAssetsLib = {
  readonly load: (
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineAssetsManifest>>;
};

export type SlugClientPlaybackLib = {
  readonly load: <P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineManifest<P>>>;
};

export type SlugClientBundleLib = {
  readonly load: <P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineBundle<P>>>;
};
