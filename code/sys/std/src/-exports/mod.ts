/**
 * @module
 * Standard system library.
 */
export { pkg } from '../pkg.ts';

/**
 * Types:
 */
export type * as t from '@sys/types/t';

/**
 * Root barrel stays minimal.
 *
 * Public libraries with dedicated leaf subpaths stay off the root barrel.
 */
