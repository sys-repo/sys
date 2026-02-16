import type { t } from './common.ts';

export type SlugLoaderDescriptorLib = {
  readonly create: (target: t.SlugLoaderDescriptorTarget) => t.SlugLoaderDescriptor;
};

export type SlugLoaderDescriptorTarget = {
  readonly id: t.StringId;
  readonly kind: t.BundleDescriptorKind;
  readonly descriptorPath: t.StringPath;
  readonly basePath: t.StringPath;
};

export type SlugLoaderDescriptor = {
  /** Deploy-supported descriptor kinds. */
  readonly kinds: () => t.BundleDescriptorKind[];
  /** Discover available kinds from deployed descriptor docs (best-effort). */
  readonly kindsFromDist: (
    origin: t.StringUrl,
  ) => Promise<t.SlugClientResult<t.BundleDescriptorKind[]>>;
  /** Resolve deploy profile path/base policy for a descriptor kind. */
  readonly target: (
    kind: t.BundleDescriptorKind,
  ) => t.SlugClientResult<t.SlugLoaderDescriptorTarget>;
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
   * matching target-kind.
   */
  readonly client: (
    args: SlugLoaderDescriptorClientArgs,
  ) => Promise<t.SlugClientResult<t.SlugClientDescriptor>>;
};

type SlugLoaderDescriptorClientArgs = {
  readonly origin: t.StringUrl | t.SlugUrlOrigin;
  readonly kind: t.BundleDescriptorKind;
  /** Optional explicit bundle selection (otherwise first matching docid is used). */
  readonly docid?: t.StringId;
};
