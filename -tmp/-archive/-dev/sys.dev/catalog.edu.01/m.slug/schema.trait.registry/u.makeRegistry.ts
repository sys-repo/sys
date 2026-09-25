import { type t } from './common.ts';

/**
 * Construct a simple in-memory registry.
 * - Throws if duplicate ids are provided.
 */
export function makeRegistry<Id extends t.SlugTraitId = t.SlugTraitId>(
  all: readonly t.SlugTraitRegistryEntry<Id>[],
): t.SlugTraitRegistry<Id> {
  const seen = new Set<Id>();
  for (const { id } of all) {
    if (seen.has(id)) throw new Error(`TraitRegistry: duplicate id "${id}"`);
    seen.add(id);
  }
  const map = new Map<Id, t.SlugTraitRegistryEntry<Id>>(all.map((d) => [d.id, d] as const));
  return {
    all,
    get: (id) => map.get(id),
  };
}
