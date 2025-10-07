/**
 * @module
 * Tools for working with file-templates that can be copied or updated to target projects.
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
export { Fs, Path } from './common.ts';
export { TmplEngine } from './m.tmpl/mod.ts';
