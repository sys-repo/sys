import type { t } from './common.ts';

/** Client surface for slug loaders. */
export type SlugClientLib = {
  readonly Error: t.SlugClientErrorLib;
  readonly Url: t.SlugClientUrlLib;
  readonly FromEndpoint: t.SlugFromEndpointLib;
  readonly FromDescriptor: t.SlugClientFromDescriptorLib;
};

/** Helpers for slug URL and filename derivation. */
export type SlugClientUrlLib = {
  readonly clean: (docid: t.StringId) => t.StringId;
  readonly assetsFilename: (docid: t.StringId) => string;
  readonly treeAssetsFilename: (docid: t.StringId) => string;
  readonly playbackFilename: (docid: t.StringId) => string;
  readonly treeFilename: (docid: t.StringId) => string;
  readonly fileContentFilename: (hash: string) => string;
  readonly isAbsoluteHref: (href: string) => boolean;
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
  readonly Playback: t.SlugClientPlaybackLib;
  readonly Assets: t.SlugClientAssetsLib;
  readonly Bundle: t.SlugClientTimelineBundleLib;
  readonly FileContent: t.SlugClientFileContentLib;
};
