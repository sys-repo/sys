/**
 * @module
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library (core):
 */
export { Yaml } from './-exports/-core.ts';
