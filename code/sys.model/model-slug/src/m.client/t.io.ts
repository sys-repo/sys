import type { t } from './common.ts';
import type { ShardCount, ShardStrategy } from '@sys/std/t';

/**
 * Endpoint loaders:
 */

/** Endpoint layout overrides for manifests and content. */
export type SlugClientLayout = {
  /** Directory where manifests are stored relative to the base URL. */
  readonly manifestsDir?: t.StringDir;
  /** Directory where hashed content payloads are stored relative to the base URL. */
  readonly contentDir?: t.StringDir;
  /** Optional shard policy hints used for timeline asset URL rewriting. */
  readonly shard?: {
    readonly video?: SlugClientShardPolicy;
    readonly image?: SlugClientShardPolicy;
  };
};

/** Descriptor wire-shape policy for per-kind shard URL rewriting. */
export type SlugClientShardPolicy = {
  readonly strategy: ShardStrategy;
  readonly total: ShardCount;
  readonly host?: 'prefix-shard' | 'none';
  readonly path?: 'preserve' | 'root-filename';
};

/** Transport authority for dynamic slug endpoints. */
export type SlugLoadTransport =
  | {
    /** Caller-owned bounded Fetch capability. */
    readonly client: t.HttpFetch.Instance;
    readonly policy?: never;
  }
  | {
    readonly client?: undefined;
    /** Policy for a Fetch capability owned for the duration of the load. */
    readonly policy: t.HttpFetch.ResponsePolicy;
  };

/** Load options that do not grant transport authority. */
export type SlugScopedLoadOptions = {
  readonly init?: t.HttpFetch.Init;
  readonly layout?: SlugClientLayout;
  /** Overrides base origins; directory layout still comes from `layout`. */
  readonly urls?: SlugLoadUrls;
};

/** Common load options for dynamic slug endpoints. */
export type SlugLoadOptions = SlugScopedLoadOptions & SlugLoadTransport;

/** Optional base URL overrides for slug loading. */
export type SlugLoadUrls = {
  readonly manifestBase?: t.StringUrl;
  readonly contentBase?: t.StringUrl;
  readonly assetBase?: t.StringUrl;
};

/** Resolver for bundle-relative hrefs. */
export type SlugBundleHrefResolver<K extends string = string> = (args: {
  readonly href: string;
  readonly kind?: K;
  readonly logicalPath?: string;
}) => string;

/** Tree endpoint loaders. */
export type SlugClientTreeLib = {
  readonly load: (
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options: t.SlugTreeLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugTreeDoc>>;
};

/** Tree loaders scoped to a descriptor client. */
export type SlugClientTreeFromDescriptorLib = {
  readonly load: (
    options?: t.SlugScopedLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugTreeDoc>>;
};

/** Load options specific to tree endpoints. */
export type SlugTreeLoadOptions = t.SlugLoadOptions;
