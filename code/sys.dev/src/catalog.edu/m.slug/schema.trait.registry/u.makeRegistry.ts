import { type t } from './common.ts';

/**
 * Construct a simple in-memory registry.
 */
export function makeRegistry(all: readonly t.TraitRegistryEntry[]): t.TraitRegistry {
  const map = new Map<t.TraitId, t.TraitRegistryEntry>(all.map((d) => [d.id, d]));
  return {
    all,
    get(id) {
      return map.get(id);
    },
  };
}
