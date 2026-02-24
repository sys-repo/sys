import type { t } from './common.ts';

/**
 * Bundle.Transform
 * Behavior-locked slug manifest derivation transforms for runtime-agnostic use.
 */
export namespace SlugBundleTransform {
  export type MediaKind = 'video' | 'image';
  export type Facet = string;
  /** Opaque graph input supplied by a caller (for example a CRDT-derived DAG). */
  export type DagInput = unknown;
  /** Runtime-neutral doc identity at the transform boundary (raw or cleaned). */
  export type DocIdInput = t.StringId;
  /** Local shard strategy vocabulary for transform layout metadata. */
  export type ShardStrategy = 'prefix-range' | string;
  export type ShardCount = number;

  export type Lib = {
    /**
     * Universal media-sequence manifest derivation.
     * Runtime adapters supply environment-specific resolution/probing behavior.
     */
    readonly derive: (args: DeriveArgs) => Promise<DeriveResult>;
  };

  export type DeriveArgs = {
    /** Pre-built slug graph/DAG provided by the caller. */
    readonly dag: DagInput;
    /** YAML path root within the source document (e.g. `/slug`). */
    readonly yamlPath: t.ObjectPath;
    /** Slug document identity to derive. */
    readonly docid: DocIdInput;
    /** Optional runtime-neutral target layout hints (shards/templates/dirs). */
    readonly target?: Target;
    /** Preserve current bundler semantics for playback-required mode. */
    readonly requirePlayback?: boolean;
    /** Optional facet narrowing for media walk behavior. */
    readonly facets?: readonly Facet[];
    /** Optional environment adapter for resolving media references. */
    readonly assetResolver?: AssetResolver;
    /** Optional environment adapter for probing media duration. */
    readonly durationProbe?: DurationProbe;
  };

  export type DeriveResult = {
    readonly ok: true;
    readonly value: Derived;
  } | {
    readonly ok: false;
    readonly error: Error;
  };

  export type Derived = {
    readonly docid: t.StringId;
    /** Behavior-locked transform issues (runtime-neutral, compiler-compatible subset). */
    readonly issues: readonly Issue[];
    /** Normalized output directory layout (computed, not materialized). */
    readonly dir: DirLayout;
    /** Descriptor/manifests layout hints computed by the transform. */
    readonly layout: DescriptorLayout;
    /** Computed output file path metadata (no writes performed here). */
    readonly files: OutputFiles;
    readonly manifests: {
      readonly assets?: t.SlugAssetsManifest;
      readonly playback?: t.SpecTimelineManifest;
      readonly tree?: t.SlugTreeDoc;
    };
  };

  export type AssetResolver = (args: AssetResolverArgs) => Promise<AssetResolverResult>;
  export type DurationProbe = (args: DurationProbeArgs) => Promise<t.Msecs | undefined>;

  export type AssetResolverArgs = {
    readonly docid: t.StringId;
    readonly kind: MediaKind;
    readonly logicalPath: string;
  };

  export type AssetResolverResult = {
    readonly ok: true;
    readonly value?: ResolvedAsset;
  } | {
    readonly ok: false;
    readonly error: Error;
  };

  export type ResolvedAsset = {
    readonly kind: MediaKind;
    readonly logicalPath: string;
    readonly hash?: string;
    readonly bytes?: Uint8Array;
    readonly filename?: string;
    readonly href?: string;
    readonly shard?: ShardMeta;
    readonly stats?: {
      readonly bytes?: number;
    };
    /** Opaque runtime adapter state passed through to probes/materializers. */
    readonly source?: unknown;
  };

  export type DurationProbeArgs = {
    readonly docid: t.StringId;
    readonly asset: ResolvedAsset;
  };

  export type Issue = {
    readonly kind: string;
    readonly severity: 'error' | 'warning';
    readonly message: string;
    readonly path?: string;
    readonly raw?: string;
    readonly resolvedPath?: string;
    readonly doc?: {
      readonly id?: t.StringId;
    };
  };

  export type DirLayout = {
    readonly base: t.StringDir;
    readonly manifests: t.StringDir;
    readonly video: t.StringDir;
    readonly image: t.StringDir;
  };

  export type OutputFiles = {
    readonly assets: OutputFile;
    readonly playback: OutputFile;
    readonly tree: OutputFile;
  };

  export type OutputFile = {
    readonly filename: t.StringPath;
    /** Absolute or base-resolved path computed by the transform. */
    readonly path: t.StringPath;
    /** Path relative to the manifest base, used for issue parity and descriptors. */
    readonly raw: t.StringPath;
  };

  export type DescriptorLayout = {
    readonly manifestsDir: t.StringDir;
    readonly mediaDirs?: {
      readonly video?: t.StringDir;
      readonly image?: t.StringDir;
    };
    readonly shard?: {
      readonly video?: ShardPolicy;
      readonly image?: ShardPolicy;
    };
  };

  export type Target = {
    readonly manifests?: {
      readonly base?: t.StringDir;
      readonly hrefBase?: t.StringUrl;
      readonly dir?: t.StringDir;
      readonly assets?: t.StringPath;
      readonly playback?: t.StringPath;
      readonly tree?: t.StringPath;
    };
    readonly media?: {
      readonly video?: TargetMedia;
      readonly image?: TargetMedia;
    };
  };

  export type TargetMedia = {
    readonly base?: t.StringDir;
    readonly hrefBase?: t.StringUrl;
    readonly dir?: t.StringDir;
    readonly shard?: ShardPolicyInput;
  };

  export type ShardPolicyInput = {
    readonly strategy?: ShardStrategy;
    readonly total: ShardCount;
    readonly host?: 'prefix-shard' | 'none';
    readonly path?: 'preserve' | 'root-filename';
  };

  export type ShardPolicy = {
    readonly strategy: ShardStrategy;
    readonly total: ShardCount;
    readonly host?: 'prefix-shard' | 'none';
    readonly path?: 'preserve' | 'root-filename';
  };

  export type ShardMeta = {
    readonly strategy: ShardStrategy;
    readonly total: number;
    readonly index: number;
  };
}
