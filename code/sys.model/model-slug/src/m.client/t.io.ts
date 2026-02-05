import type { t } from './common.ts';

/**
 * Endpoint loaders:
 */
/** Endpoint layout overrides for manifests and content. */
export type SlugClientLayout = {
  /** Directory where manifests are stored relative to the base URL. */
  readonly manifestsDir?: t.StringDir;
  /** Directory where hashed content payloads are stored relative to the base URL. */
  readonly contentDir?: t.StringDir;
};

/** Common load options for slug endpoints. */
export type SlugLoadOptions = {
  init?: RequestInit;
  baseHref?: t.StringUrl;
  layout?: SlugClientLayout;
  manifestsBaseUrl?: t.StringUrl;
  contentBaseUrl?: t.StringUrl;
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
    options?: t.SlugTreeLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugTreeDoc>>;
};

/** Tree loaders scoped to a descriptor client. */
export type SlugClientTreeFromDescriptorLib = {
  readonly load: (options?: t.SlugTreeLoadOptions) => Promise<t.SlugClientResult<t.SlugTreeDoc>>;
};

/** Load options specific to tree endpoints. */
export type SlugTreeLoadOptions = t.SlugLoadOptions;
