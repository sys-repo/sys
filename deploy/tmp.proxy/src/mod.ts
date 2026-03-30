/**
 * @module
 * Reverse proxy for root-site and mounted bundle passthrough.
 */
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
export { ReverseProxy } from './m.server/mod.ts';
