import type { t } from './common.ts';

/** Schema-local trait ids (narrow set for this package). */
export type { SchemaTraitId } from './m.ids.ts';

/** Single entry coupling id → props schema. */
export type SchemaTraitRegistryEntry<Id extends t.SchemaTraitId = t.SchemaTraitId> = {
  readonly id: Id;
  readonly propsSchema: t.TSchema;
};

/** Collection + lookup for schema traits. */
export type SchemaTraitRegistry<Id extends t.SchemaTraitId = t.SchemaTraitId> = {
  readonly all: readonly SchemaTraitRegistryEntry<Id>[];
  get(id: Id): SchemaTraitRegistryEntry<Id> | undefined;
};
