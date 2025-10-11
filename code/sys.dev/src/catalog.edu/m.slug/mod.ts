/**
 * @module Slug
 * Core slug schemas, concrete trait schemas, and the default trait registry.
 */
export { SlugSchema, TraitBindingSchema, TraitDefSchema } from './schema.slug/mod.ts';
export { TraitRegistryDefault } from './schema.trait.registry/mod.ts';
export { VideoPlayerPropsSchema, VideoRecorderPropsSchema } from './schema.traits/mod.ts';

export type { CatalogTraitId } from './schema.trait.registry/m.ids.ts';
