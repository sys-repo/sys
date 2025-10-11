import type { t } from './common.ts';

/**
 * Definition of a registered trait type and its schema.
 */
export type TraitRegistryEntry = {
  readonly id: t.TraitId;
  readonly propsSchema: t.TSchema;
};

/**
 * Collection of trait definitions with lookup utilities.
 */
export type TraitRegistry = {
  readonly all: readonly t.TraitRegistryEntry[];
  get(id: t.TraitId): t.TraitRegistryEntry | undefined;
};
