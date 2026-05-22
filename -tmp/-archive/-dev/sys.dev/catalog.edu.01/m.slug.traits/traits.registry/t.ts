import type { t } from './common.ts';
export type { SchemaTraitId } from './m.ids.ts';

/**
 * Single trait entry mapping a canonical `SchemaTraitId` to
 * its props schema and optional normalizer.
 */
export type SchemaTraitRegistryEntry = t.SlugTraitRegistryEntry<t.SchemaTraitId>;

/**
 * Registry of all canonical schema traits with typed id lookup.
 */
export type SchemaTraitRegistry = t.SlugTraitRegistry<t.SchemaTraitId>;
