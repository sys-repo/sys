import type { t } from './common.ts';

/**
 * Definition of a registered trait and its props schema.
 */
export type SlugTraitRegistryEntry<Id extends t.SlugTraitId = t.SlugTraitId> = {
  readonly id: Id;
  readonly propsSchema: t.TSchema;
};

/**
 * Collection of trait definitions with lookup.
 */
export type SlugTraitRegistry<Id extends t.SlugTraitId = t.SlugTraitId> = {
  readonly all: readonly SlugTraitRegistryEntry<Id>[];
  get(id: Id): SlugTraitRegistryEntry<Id> | undefined;
};

/**
 * Function that converts a trait's authoring form into its canonical
 * schema shape before validation.
 *
 * Example:
 *   normalizeSlugTreeAuthoring(yamlValue) → { items: [...] }
 */
export type SlugTraitNormalizer = (input: unknown) => unknown;

/**
 * A map of trait-normalizers keyed by Id (all optional).
 */
export type SlugTraitNormalizers<Id extends t.SlugTraitId = t.SlugTraitId> = Partial<
  Record<Id, t.SlugTraitNormalizer>
>;
