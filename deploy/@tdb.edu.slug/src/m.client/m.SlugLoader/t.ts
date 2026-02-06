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
};

/**
 * Client loader instance.
 */
export type SlugClientLoader = {
  /** Canonicalized origin endpoints used by the loader. */
  readonly origin: t.SlugUrlOrigin;
};
