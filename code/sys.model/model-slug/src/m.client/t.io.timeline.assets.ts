import { type t } from './common.ts';

/** Asset-manifest endpoint loaders. */
export type SlugClientAssetsLib = {
  readonly load: (
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineAssetsManifest>>;
};

/** Asset loaders scoped to a descriptor client. */
export type SlugClientAssetsFromDescriptorLib = {
  readonly load: (
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineAssetsManifest>>;
};
