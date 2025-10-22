/**
 * @module Slug
 * Domain schemas, trait registry, and semantic validation rules.
 * Format-agnostic; used by YAML pipelines and future data sources.
 */
export type { CatalogTraitId } from './schema.trait.registry/m.ids.ts';

export { Slug } from './m.Slug.ts';
export * from './schema.slug/mod.ts';
export * from './schema.trait.registry/mod.ts';
export * from './schema.traits/mod.ts';
export * from './schema.validation/mod.ts';
