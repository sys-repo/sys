import type { t } from './common.ts';

/**
 * Canonical set of schema-layer normalizers keyed by trait id.
 * Keep this narrowly scoped to built-ins you actually ship.
 */
export type SchemaTraitNormalizers = {
  readonly 'slug-tree': t.SlugTreeYamlNormalizer;
};

/**
 * Authoring-DSL → canonical converter for the 'slug-tree' trait.
 * Returns the schema-shape payload expected at `data[as]`.
 */
export type SlugTreeYamlNormalizer = (input: unknown) => {
  readonly slugs: readonly t.SlugTreeItem[];
  readonly summary?: string;
};
