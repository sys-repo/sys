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
export { Try } from '../m.Try/mod.ts';
export { Fn } from '../m.Fn/mod.ts';
export { History } from '../m.History/mod.ts';
export { Lazy } from '../m.Lazy/mod.ts';
export { Regex } from '../m.Regex/mod.ts';
