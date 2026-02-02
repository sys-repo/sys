import type { t } from './common.ts';

/**
 * Endpoint loaders:
 */
export type SlugClientLayout = {
  /** Directory where manifests are stored relative to the base URL. */
  readonly manifestsDir?: t.StringDir;
  /** Directory where hashed content payloads are stored relative to the base URL. */
  readonly contentDir?: t.StringDir;
};

export type SlugLoadOptions = {
  init?: RequestInit;
  baseHref?: t.StringUrl;
  layout?: SlugClientLayout;
};

export type SlugBundleHrefResolver<K extends string = string> = (args: {
  readonly href: string;
  readonly kind?: K;
  readonly logicalPath?: string;
}) => string;

export type SlugClientTreeLib = {
  readonly load: (
    baseUrl: t.StringUrl,
    docid: t.StringId,
    options?: t.SlugTreeLoadOptions,
  ) => Promise<t.SlugClientResult<t.SlugTreeDoc>>;
};

export type SlugClientTreeFromDescriptorLib = {
  readonly load: (options?: t.SlugTreeLoadOptions) => Promise<t.SlugClientResult<t.SlugTreeDoc>>;
};

export type SlugTreeLoadOptions = t.SlugLoadOptions & {
  manifestsBaseUrl?: t.StringUrl;
};
