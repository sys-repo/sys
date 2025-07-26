/**
 * Tools for working with strings of text.
 * @module
 *
 * @example
 * ```ts
 * import { Str, Diff } from '@sys/text';
 * import { Fuzzy } from '@sys/text/fuzzy';
 * ```
 */
export { pkg } from './pkg.ts';
/** Type library (barrel file). */
export type * as t from './types.ts';

export { Str } from './common.ts';
export { Diff } from './m.Diff/mod.ts';
