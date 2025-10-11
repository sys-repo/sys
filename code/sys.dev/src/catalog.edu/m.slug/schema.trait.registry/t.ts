import type { t } from './common.ts';

/**
 * Definition of a registered trait and its props schema.
 */
export type TraitRegistryEntry<Id extends t.TraitId = t.TraitId> = {
  readonly id: Id;
  readonly propsSchema: t.TSchema;
};

/**
 * Collection of trait definitions with lookup.
 */
export type TraitRegistry<Id extends t.TraitId = t.TraitId> = {
  readonly all: readonly TraitRegistryEntry<Id>[];
  get(id: Id): TraitRegistryEntry<Id> | undefined;
};
