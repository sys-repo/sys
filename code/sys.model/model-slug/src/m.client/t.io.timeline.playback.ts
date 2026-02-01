import { type t } from './common.ts';

export type SlugClientPlaybackLib = {
  readonly load: <P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineManifest<P>>>;
};

export type SlugClientPlaybackFromDescriptorLib = {
  readonly load: <P = unknown>(
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineManifest<P>>>;
};

export type SlugClientTimelineBundleLib = {
  readonly load: <P = unknown>(
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineBundle<P>>>;
};

export type SlugClientTimelineBundleFromDescriptorLib = {
  readonly load: <P = unknown>(
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineBundle<P>>>;
};
