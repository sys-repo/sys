/**
 * @module
 * Slug-oriented runtime loaders and glue.
 *
 * - No UI
 * - No implicit FS
 * - Schema-truthful wire ingestion
 */
export { SlugClient, SlugUrl } from './m.client/mod.ts';
export { pkg } from './pkg.ts';
export type * from './m.client/t.ts';
