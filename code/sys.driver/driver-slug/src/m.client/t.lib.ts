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
  unwrap<T>(res: t.Result<T>): T;
  throw(err: t.SlugClientError): never;
};

/**
 * Endpoint loaders:
 */
export type SlugLoadOptions = { init?: RequestInit; baseHref?: t.StringUrl };

export type SlugFromEndpointLib = {
  loadAssets(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    init?: RequestInit,
  ): Promise<t.Result<t.SpecTimelineAssetsManifest>>;

  loadPlayback<P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    init?: RequestInit,
  ): Promise<t.Result<t.SpecTimelineManifest<P>>>;

  loadBundle<P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadBundleOptions,
  ): Promise<t.Result<t.SpecTimelineBundle<P>>>;
};
