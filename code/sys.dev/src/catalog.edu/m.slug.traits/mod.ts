/**
 * @module slug.traits
 *
 * Defines the canonical trait schemas and registry for catalog Slugs.
 *
 * Each trait module specifies its typed props schema and contributes to
 * the global `CatalogTraitRegistry`, forming the authoritative reference
 * for trait validation and introspection across the system.
 */
export type { CatalogTraitId } from './schema.trait.registry/m.ids.ts';

export * from './schema.trait.registry/mod.ts';
export * from './schema.traits/mod.ts';
