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
  readonly treeFilename: (docid: t.StringId) => string;
  readonly isAbsoluteHref: (href: string) => boolean;
};

export type SlugClientErrorLib = {
  readonly unwrap: <T>(res: t.SlugClientResult<T>) => T;
  readonly throw: (err: t.SlugClientError) => never;
};
