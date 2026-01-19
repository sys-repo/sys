import type { t } from './common.ts';

export type SlugClientUrlLib = {
  readonly clean: (docid: t.StringId) => t.StringId;
  readonly assetsFilename: (docid: t.StringId) => string;
  readonly playbackFilename: (docid: t.StringId) => string;
};

export type SlugClientLib = {
  readonly Url: t.SlugClientUrlLib;

  loadAssetsFromEndpoint(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    init?: RequestInit,
  ): Promise<t.Result<t.SpecTimelineAssetsManifest>>;

  loadPlaybackFromEndpoint<P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    init?: RequestInit,
  ): Promise<t.Result<t.SpecTimelineManifest<P>>>;

  loadBundleFromEndpoint<P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    args?: LoadBundleArgs,
  ): Promise<t.Result<t.SpecTimelineBundle<P>>>;
};

export type LoadBundleArgs = { init?: RequestInit; baseHref?: t.StringUrl };
