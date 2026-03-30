/**
 * @module
 * Reverse proxy for root-site and mounted upstream passthrough.
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
export { HttpProxy } from './m.server/mod.ts';
