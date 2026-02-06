import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.origin.ts';

/**
 * Tools for wrapping a pure HTTP `SlugClient` for loading
 * data within a complex UI domain.
 */
export type SlugLoaderLib = {
  readonly make: (origin: t.StringUrl | t.SlugLoaderOrigin) => t.SlugLoader;
  readonly Fetch: t.SlugClientLib;
  readonly Origin: t.SlugLoaderOriginLib;
};

/**
 * Client loader instance.
 */
export type SlugLoader = {
  /** Canonicalized origin endpoints used by the loader. */
  readonly origin: t.SlugLoaderOrigin;
};
