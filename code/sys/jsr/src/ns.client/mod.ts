/**
 * Tools for working with the JSR module registry (on the client).
 * https://jsr.io/docs
 * @module
 */
/** JSR package metadata. */
export { pkg } from '../pkg.ts';

/** Module type aliases. */
export type * as t from '../types.ts';

/** Helpers for fetching registry data. */
export { Fetch } from './m.Fetch/mod.ts';

/** Client registry helpers. */
export { Jsr } from './m.Jsr/mod.ts';
