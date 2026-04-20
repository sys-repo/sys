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
 * Root-owned libraries.
 *
 * Symbols with dedicated public leaf subpaths stay off the root barrel.
 */
export { Dispose } from '../m.Dispose/mod.ts';
