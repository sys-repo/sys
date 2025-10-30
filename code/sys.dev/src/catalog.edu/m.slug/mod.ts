/**
 * @module Slug (core)
 * Core schemas and semantic validation (no concrete traits).
 */
export { Slug } from './m.Slug.ts';
export { Pattern } from './schema.slug/mod.ts';

export * from './schema.trait.registry/mod.ts'; // types + factory only.
export * from './schema.validation/mod.ts';

export {
  SlugMinimalSchema,
  SlugRefSchema,
  SlugSchema,
  SlugWithDataSchema,
} from './schema.slug/mod.ts';
