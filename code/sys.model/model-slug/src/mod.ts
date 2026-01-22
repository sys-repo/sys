/**
 * @module
 * Slug-oriented runtime loaders and glue.
 *
 * - No UI
 * - No implicit FS
 * - Schema-truthful wire ingestion
 */
export { pkg } from './pkg.ts';

export { SlugClient } from './m.client/mod.ts';
export { SlugSchema } from './m.schema/mod.ts';
