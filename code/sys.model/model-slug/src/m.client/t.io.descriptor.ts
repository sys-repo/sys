import type { t } from './common.ts';

/** Descriptor-to-client constructor surface. */
export type SlugClientFromDescriptorLib = {
  readonly select: (
    args: SlugClientFromDescriptorSelectArgs,
  ) => t.SlugClientResult<t.BundleDescriptor>;
  readonly make: (args: SlugClientFromDescriptorArgs) => t.SlugClientResult<SlugClientDescriptor>;
};

/** Loader for reading a descriptor document. */
export type SlugClientDescriptorLoadLib = {
  readonly load: (
    origin: t.StringUrl,
    manifests: t.StringPath,
    transport: t.SlugLoadTransport,
  ) => Promise<t.SlugClientResult<t.BundleDescriptorDoc>>;
};

/** Inputs for constructing a descriptor-backed client. */
export type SlugClientFromDescriptorArgs = {
  readonly descriptor: t.BundleDescriptor | t.BundleDescriptorDoc;
  readonly baseUrl: t.StringUrl;
  readonly kind?: t.BundleDescriptorKind;
  readonly docid?: t.StringId;
} & t.SlugLoadTransport;

/** Inputs for selecting one bundle from a descriptor (or descriptor-doc). */
export type SlugClientFromDescriptorSelectArgs = {
  readonly descriptor: t.BundleDescriptor | t.BundleDescriptorDoc;
  readonly kind?: t.BundleDescriptorKind;
  readonly docid?: t.StringId;
};

/** Normalized slug descriptor with derived loaders. */
export type SlugClientDescriptor = t.Lifecycle & {
  readonly kind: t.BundleDescriptorKind;
  readonly docid: t.StringId;
  readonly baseUrl: t.StringUrl;
  readonly assetBase: t.StringUrl;
  readonly layout?: t.SlugClientLayout;
  readonly Tree: t.SlugClientTreeFromDescriptorLib;
  readonly Timeline: t.SlugClientTimelineFromDescriptorLib;
  readonly FileContent: t.SlugClientFileContentFromDescriptorLib;
};
