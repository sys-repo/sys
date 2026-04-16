/**
 * @module
 * Slug-dataset runtime entrypoint published at `@tdb/data/slug`.
 *
 * @example
 * ```ts
 * import { DataClient, SlugMounts } from '@tdb/data/slug';
 *
 * const client = DataClient;
 * ```
 */
export { DataClient, SlugMounts } from './m/mod.ts';

/** Slug type surface. */
export type * as t from './types.ts';
