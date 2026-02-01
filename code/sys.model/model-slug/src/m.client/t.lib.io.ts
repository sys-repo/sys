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
  readonly FileContent: t.SlugClientFileContentLib;
};

export type SlugClientTreeLib = {
  readonly load: (
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugTreeDoc>>;
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

export type SlugFileContentLoadOptions = t.SlugLoadOptions & {
  /** Directory for hashed content payloads relative to the base URL. */
  readonly dir?: t.StringDir;
};

export type SlugClientFileContentLib = {
  readonly index: (
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugFileContentIndex>>;
  readonly get: (
    baseUrl: t.StringUrl,
    hash: string,
    options?: t.SlugFileContentLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugFileContentDoc>>;
};
