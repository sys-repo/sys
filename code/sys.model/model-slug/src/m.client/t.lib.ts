import type { t } from './common.ts';

export type SlugClientLib = {
  readonly Error: t.SlugClientErrorLib;
  readonly Url: t.SlugClientUrlLib;
  readonly FromEndpoint: t.SlugFromEndpointLib;
  readonly FromDescriptor: t.SlugClientFromDescriptorLib;
};

export type SlugClientUrlLib = {
  readonly clean: (docid: t.StringId) => t.StringId;
  readonly assetsFilename: (docid: t.StringId) => string;
  readonly treeAssetsFilename: (docid: t.StringId) => string;
  readonly playbackFilename: (docid: t.StringId) => string;
  readonly treeFilename: (docid: t.StringId) => string;
  readonly fileContentFilename: (hash: string) => string;
  readonly isAbsoluteHref: (href: string) => boolean;
};

export type SlugClientErrorLib = {
  readonly unwrap: <T>(res: t.SlugClientResult<T>) => T;
  readonly throw: (err: t.SlugClientError) => never;
};

export type SlugFromEndpointLib = {
  readonly Descriptor: t.SlugClientDescriptorLoadLib;
  readonly Tree: t.SlugClientTreeLib;
  readonly Playback: t.SlugClientPlaybackLib;
  readonly Assets: t.SlugClientAssetsLib;
  readonly Bundle: t.SlugClientTimelineBundleLib;
  readonly FileContent: t.SlugClientFileContentLib;
};
