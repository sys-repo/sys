import type { t } from './common.ts';

/**
 * Tools for wrapping a pure HTTP `SlugClient` for loading
 * data within a complex UI domain.
 */
export type SlugClientLoaderLib = {
  readonly Fetch: t.SlugClientLib;
};
