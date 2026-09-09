/**
 * @module slug.traits
 *
 * Defines the canonical trait schemas and registry for catalog Slugs.
 *
 * Each trait module specifies its typed props schema and contributes to
 * the global `CatalogTraitRegistry`, forming the authoritative reference
 * for trait validation and introspection across the system.
 */
export * from './traits.registry/mod.ts';
export { Traits, VideoPlayerPropsSchema, VideoRecorderPropsSchema } from './traits.schema/mod.ts';
