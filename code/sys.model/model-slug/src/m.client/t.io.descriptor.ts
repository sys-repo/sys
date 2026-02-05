import type { t } from './common.ts';

/** Descriptor-to-client constructor surface. */
export type SlugClientFromDescriptorLib = {
  readonly make: (args: SlugClientFromDescriptorArgs) => t.SlugClientResult<SlugClientDescriptor>;
};

/** Loader for reading a descriptor document. */
export type SlugClientDescriptorLoadLib = {
  readonly load: (
    origin: t.StringUrl,
    manifests: t.StringPath,
  ) => Promise<t.SlugClientResult<t.BundleDescriptorDoc>>;
};

/** Inputs for constructing a descriptor-backed client. */
export type SlugClientFromDescriptorArgs = {
  readonly descriptor: t.BundleDescriptor | t.BundleDescriptorDoc;
  readonly baseUrl: t.StringUrl;
  readonly kind?: t.BundleDescriptorKind;
  readonly docid?: t.StringId;
};

/** Normalized slug descriptor with derived loaders. */
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
