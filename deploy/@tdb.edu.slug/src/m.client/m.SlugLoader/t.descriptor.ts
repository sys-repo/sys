import type { t } from './common.ts';

export type SlugClientLoaderDescriptorLib = {
  readonly create: (args: CreateArgs) => t.SlugClientLoaderDescriptor;
};

export type SlugClientLoaderDescriptorTarget = {
  readonly id: t.StringId;
  readonly kind: t.BundleDescriptorKind;
  readonly descriptorPath: t.StringPath;
  readonly basePath: t.StringPath;
};

type CreateArgs = {
  readonly targets: readonly t.SlugClientLoaderDescriptorTarget[];
  /** Optional explicit default target-id per kind (otherwise first declared target is used). */
  readonly defaults?: Partial<Record<t.BundleDescriptorKind, t.StringId>>;
};

export type SlugClientLoaderDescriptor = {
  /** Deploy-supported descriptor kinds. */
  readonly kinds: () => t.BundleDescriptorKind[];
  /** Discover available kinds from deployed descriptor docs (best-effort). */
  readonly kindsFromDist: (
    origin: t.StringUrl,
  ) => Promise<t.SlugClientResult<t.BundleDescriptorKind[]>>;

  /** Full target inventory. */
  readonly targets: () => readonly t.SlugClientLoaderDescriptorTarget[];
  /** Resolve a target by ID. */
  readonly targetById: (id: t.StringId) => t.SlugClientResult<t.SlugClientLoaderDescriptorTarget>;
  /** Resolve default target for a kind (legacy convenience). */
  readonly target: (
    kind: t.BundleDescriptorKind,
  ) => t.SlugClientResult<t.SlugClientLoaderDescriptorTarget>;
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
    args: SlugClientLoaderDescriptorClientArgs,
  ) => Promise<t.SlugClientResult<t.SlugClientDescriptor>>;
};

export type SlugClientLoaderDescriptorClientArgs =
  | {
      readonly origin: t.StringUrl | t.SlugUrlOrigin;
      readonly kind: t.BundleDescriptorKind;
      readonly targetId?: t.StringId;
      /** Optional explicit bundle selection (otherwise first matching docid is used). */
      readonly docid?: t.StringId;
    }
  | {
      readonly origin: t.StringUrl | t.SlugUrlOrigin;
      readonly targetId: t.StringId;
      readonly kind?: t.BundleDescriptorKind;
      /** Optional explicit bundle selection (otherwise first matching docid is used). */
      readonly docid?: t.StringId;
    };
