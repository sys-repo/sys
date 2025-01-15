/**
 * @module
 * Tools for working with the JSR module registry.
 * https://jsr.io/docs
 *
 * @example
 * ```ts
 * import { Jsr } from 'jsr:@sys/jsr';
 * ```
 */
export { pkg } from './pkg.ts';

/** Module types. */
export type * as t from './types.ts';

/**
 * Library.
 */
export { Jsr } from './m.Jsr/mod.ts';
