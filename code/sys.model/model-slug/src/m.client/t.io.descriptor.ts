import type { t } from './common.ts';

export type SlugClientFromDescriptorLib = {
  readonly make: (
    args: SlugClientFromDescriptorArgs,
  ) => Promise<t.SlugClientResult<SlugClientDescriptor>>;
};

export type SlugClientFromDescriptorArgs = {
  readonly descriptor: t.BundleDescriptor | t.BundleDescriptorDoc;
  readonly baseUrl: t.StringUrl;
  readonly baseHref?: t.StringUrl;
  readonly kind?: t.BundleDescriptorKind;
  readonly docid?: t.StringId;
};

export type SlugClientDescriptor = {
  readonly kind: t.BundleDescriptorKind;
  readonly docid: t.StringId;
  readonly baseUrl: t.StringUrl;
  readonly baseHref: t.StringUrl;
  readonly layout?: t.SlugClientLayout;
  readonly Tree: t.SlugClientTreeFromDescriptorLib;
  readonly Playback: t.SlugClientPlaybackFromDescriptorLib;
  readonly Assets: t.SlugClientAssetsFromDescriptorLib;
  readonly Bundle: t.SlugClientTimelineBundleFromDescriptorLib;
  readonly FileContent: t.SlugClientFileContentFromDescriptorLib;
};
