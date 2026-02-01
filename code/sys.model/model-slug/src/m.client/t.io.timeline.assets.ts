import { type t } from './common.ts';

export type SlugClientAssetsLib = {
  readonly load: (
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineAssetsManifest>>;
};

export type SlugClientAssetsFromDescriptorLib = {
  readonly load: (
    options?: t.SlugLoadOptions,
  ) => Promise<t.SlugClientResult<t.SpecTimelineAssetsManifest>>;
};
