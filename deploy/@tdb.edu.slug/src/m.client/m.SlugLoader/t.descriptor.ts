import type { t } from './common.ts';

/** Descriptor-backed slug client helpers. */
export type SlugLoaderDescriptorLib = {
  readonly create: (target: t.SlugLoaderDescriptorTarget) => t.SlugLoaderDescriptor;
};

/** Descriptor binding used to resolve a slug client. */
export type SlugLoaderDescriptorTarget = {
  readonly id: t.StringId;
  readonly kind: t.BundleDescriptorKind;
  readonly descriptorPath: t.StringPath;
  readonly basePath: t.StringPath;
};

/** Bound descriptor loader for a specific deploy target. */
export type SlugLoaderDescriptor = {
  /** Deploy-supported descriptor kind. */
  readonly kind: t.BundleDescriptorKind;

  /** Resolve the bound deploy profile path/base policy. */
  readonly target: () => t.SlugLoaderDescriptorTarget;

  /** Load descriptor document from canonical descriptor path. */
  readonly load: (origin: t.StringUrl) => Promise<t.SlugClientResult<t.BundleDescriptorDoc>>;

  /** Load descriptor and list matching docids for the bound kind. */
  readonly docids: (origin: t.StringUrl) => Promise<t.SlugClientResult<t.StringId[]>>;

  /**
   * Build descriptor-backed client from canonical deploy profile path policy.
   * If `docid` is omitted, deploy policy selects the first descriptor bundle
   * matching target-kind.
   */
  readonly client: (
    args: SlugLoaderDescriptorClientArgs,
  ) => Promise<t.SlugClientResult<t.SlugClientDescriptor>>;
};

/** Inputs for building a descriptor-backed slug client. */
export type SlugLoaderDescriptorClientArgs = {
  origin: t.StringUrl | t.SlugUrlOrigin;
  /** Optional explicit bundle selection (otherwise first matching docid is used). */
  docid?: t.StringId;
};
