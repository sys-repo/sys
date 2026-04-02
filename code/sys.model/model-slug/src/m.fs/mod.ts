/**
 * @module
 * Filesystem-backed slug tree ingestion helpers.
 */
export type * from './t.ts';
export { ensureFrontmatterRef, readFrontmatterRef } from './m.SlugTree/u.frontmatter.ts';
export { fromDir } from './m.SlugTree/u.fromDir.ts';
export { SlugTreeFs } from './m.SlugTree/mod.ts';
