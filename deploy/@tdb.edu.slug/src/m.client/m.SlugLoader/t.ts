import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.origin.ts';

/**
 * Tools for wrapping a pure HTTP `SlugClient` for loading
 * data within a complex UI domain.
 */
export type SlugClientLoaderLib = {
  readonly make: (origin: t.StringUrl | t.SlugUrlOrigin) => t.SlugClientLoader;
  readonly Fetch: t.SlugClientLib;
  readonly Origin: t.SlugClientLoaderOriginLib;
  readonly Descriptor: t.SlugClientLoaderDescriptorLib;
};

/**
 * Client loader instance.
 */
export type SlugClientLoader = {
  /** Canonicalized origin endpoints used by the loader. */
  readonly origin: t.SlugUrlOrigin;
};

export type SlugClientLoaderDescriptorLib = {
  /** Deploy-supported descriptor kinds. */
  readonly kinds: () => t.BundleDescriptorKind[];
  /** Discover available kinds from deployed descriptor docs (best-effort). */
  readonly kindsFromDist: (origin: t.StringUrl) => Promise<t.SlugClientResult<t.BundleDescriptorKind[]>>;
  /** Resolve deploy profile path/base policy for a descriptor kind. */
  readonly target: (kind: t.BundleDescriptorKind) => t.SlugClientResult<t.SlugClientLoaderDescriptorTarget>;
  /** Load descriptor document from canonical descriptor path. */
  readonly load: (
    origin: t.StringUrl,
    kind: t.BundleDescriptorKind,
  ) => Promise<t.SlugClientResult<t.BundleDescriptorDoc>>;
  /** Load descriptor and list matching docids for the kind. */
  readonly docids: (
    origin: t.StringUrl,
    kind: t.BundleDescriptorKind,
  ) => Promise<t.SlugClientResult<t.StringId[]>>;
  /**
   * Build descriptor-backed client from canonical deploy profile path policy.
   * If `docid` is omitted, deploy policy selects the first descriptor bundle
   * matching `kind`.
   */
  readonly client: (
    args: SlugClientLoaderDescriptorClientArgs,
  ) => Promise<t.SlugClientResult<t.SlugClientDescriptor>>;
};

export type SlugClientLoaderDescriptorTarget = {
  readonly kind: t.BundleDescriptorKind;
  readonly descriptorPath: t.StringPath;
  readonly basePath: t.StringPath;
};

export type SlugClientLoaderDescriptorClientArgs = {
  readonly origin: t.StringUrl | t.SlugUrlOrigin;
  readonly kind: t.BundleDescriptorKind;
  /** Optional explicit bundle selection (otherwise first matching docid is used). */
  readonly docid?: t.StringId;
};
