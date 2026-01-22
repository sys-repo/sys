import type { t } from './common.ts';

export type SlugClientLib = {
  readonly Error: t.SlugClientErrorLib;
  readonly Url: t.SlugClientUrlLib;
  readonly FromEndpoint: t.SlugFromEndpointLib;
};

export type SlugClientUrlLib = {
  readonly clean: (docid: t.StringId) => t.StringId;
  readonly assetsFilename: (docid: t.StringId) => string;
  readonly playbackFilename: (docid: t.StringId) => string;
  readonly isAbsoluteHref: (href: string) => boolean;
};

export type SlugClientErrorLib = {
  readonly unwrap: <T>(res: t.Result<T>) => T;
  readonly throw: (err: t.SlugClientError) => never;
};

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

export type SlugClientTreeLib = {};

export type SlugClientAssetsLib = {
  readonly load: (
    baseUrl: t.StringUrl,
    docid: t.StringId,
    init?: t.SlugLoadOptions,
  ) => Promise<t.Result<t.SpecTimelineAssetsManifest>>;
};

export type SlugClientPlaybackLib = {
  readonly load: <P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    init?: t.SlugLoadOptions,
  ) => Promise<t.Result<t.SpecTimelineManifest<P>>>;
};

export type SlugClientBundleLib = {
  readonly load: <P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.Result<t.SpecTimelineBundle<P>>>;
};
