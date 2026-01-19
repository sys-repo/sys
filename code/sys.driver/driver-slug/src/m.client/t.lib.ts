import type { t } from './common.ts';

export type SlugClientUrlLib = {
  readonly clean: (docid: t.StringId) => t.StringId;
  readonly assetsFilename: (docid: t.StringId) => string;
  readonly playbackFilename: (docid: t.StringId) => string;
};

export type SlugClientLib = {
  readonly Url: t.SlugClientUrlLib;
  readonly FromEndpoint: t.SlugFromEndpointLib;
};

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
    args?: LoadBundleArgs,
  ): Promise<t.Result<t.SpecTimelineBundle<P>>>;
};

export type LoadBundleArgs = { init?: RequestInit; baseHref?: t.StringUrl };
