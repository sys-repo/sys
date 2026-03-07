import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.origin.ts';
export type * from './t.descriptor.ts';

/**
 * Tools for wrapping a pure HTTP `SlugClient` for loading
 * data within a complex UI domain.
 */
export type SlugLoaderLib = {
  readonly Fetch: t.SlugClientLib;
  readonly Origin: t.SlugLoaderOriginLib;
  readonly Descriptor: t.SlugLoaderDescriptorLib;
};
