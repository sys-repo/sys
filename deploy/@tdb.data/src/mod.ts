/**
 * @module
 * Public package entry for staged-data package metadata, clients, and type exports.
 *
 * @example
 * ```ts
 * import { pkg } from '@tdb/data';
 *
 * const version = pkg.version;
 * ```
 */
export { pkg } from './pkg.ts';
export { DataClient, SlcMounts } from './m/mod.ts';

/** Package type surface. */
export type * as t from './types.ts';
