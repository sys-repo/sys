/**
 * @module
 * Tools for working with the JSR module registry (on the client).
 * https://jsr.io/docs
 */
export { pkg } from '../pkg.ts';

/** Module types. */
export type * as t from '../types.ts';

/**
 * Library.
 */
export { Fetch } from './m.Fetch/mod.ts';
export { Jsr } from './m.Jsr/mod.ts';
