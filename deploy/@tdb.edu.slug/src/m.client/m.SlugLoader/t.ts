import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.origin.ts';
export type * from './t.descriptor.ts';

/**
 * Tools for wrapping a pure HTTP `SlugClient` for loading
 * data within a complex UI domain.
 */
export type SlugLoaderLib = {
  readonly make: (origin: t.StringUrl | t.SlugUrlOrigin) => t.SlugClientLoader;
  readonly Fetch: t.SlugClientLib;
  readonly Origin: t.SlugLoaderOriginLib;
  readonly Descriptor: t.SlugLoaderDescriptorCatalog;
  readonly DescriptorFactory: t.SlugLoaderDescriptorLib;
};

/**
 * Client loader instance.
 */
export type SlugClientLoader = {
  /** Canonicalized origin endpoints used by the loader. */
  readonly origin: t.SlugUrlOrigin;
};
