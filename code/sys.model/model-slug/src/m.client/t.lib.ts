import type { t } from './common.ts';

/** Client surface for slug loaders. */
export type SlugClientLib = {
  readonly Error: t.SlugClientErrorLib;
  readonly Url: t.SlugClientUrlLib;
  readonly FromEndpoint: t.SlugFromEndpointLib;
  readonly FromDescriptor: t.SlugClientFromDescriptorLib;
};

/** Helpers for normalizing client errors. */
export type SlugClientErrorLib = {
  readonly unwrap: <T>(res: t.SlugClientResult<T>) => T;
  readonly throw: (err: t.SlugClientError) => never;
};

/** Endpoint loaders grouped by resource kind. */
export type SlugFromEndpointLib = {
  readonly Descriptor: t.SlugClientDescriptorLoadLib;
  readonly Tree: t.SlugClientTreeLib;
  readonly Timeline: t.SlugClientTimelineLib;
  readonly FileContent: t.SlugClientFileContentLib;
};

export type SlugClientTimelineLib = {
  readonly Playback: t.SlugClientPlaybackLib;
  readonly Assets: t.SlugClientAssetsLib;
  readonly Bundle: t.SlugClientTimelineBundleLib;
};
