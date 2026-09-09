import type { t } from './common.ts';

/**
 * Authoring → canonical pre-validation transform.
 */
export type SlugTraitNormalizer = (input: unknown) => unknown;

/**
 * Map of normalizers keyed by trait-id.
 */
export type SlugTraitNormalizers<Id extends t.SlugTraitId = t.SlugTraitId> = Partial<
  Record<Id, SlugTraitNormalizer>
>;

/**
 * Single entry coupling id → props schema (+ optional normalize hook).
 */
export type SlugTraitRegistryEntry<Id extends t.SlugTraitId = t.SlugTraitId> = {
  readonly id: Id;
  readonly propsSchema: t.TSchema;
  readonly normalize?: SlugTraitNormalizer;
};

/**
 * Collection of trait definitions with lookup.
 */
export type SlugTraitRegistry<Id extends t.SlugTraitId = t.SlugTraitId> = {
  readonly all: readonly SlugTraitRegistryEntry<Id>[];
  get(id: Id): SlugTraitRegistryEntry<Id> | undefined;
};
