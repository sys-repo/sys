import type { t } from './common.ts';

type Id = string;
type Doc = t.Doc<any>;
type RegistryEntry = { total: number };

const store = new Map<Id, RegistryEntry>();

/**
 * A registry of all current Lens instances.
 *
 * NOTE:
 *    Keeping track of the instance count is required
 *    within the lens so that when changing, the lens
 *    knows how many times it needs to run it's initial
 *    "get" function to ensure that within the entire
 *    sub-tree all lens's may construct accurately.
 */
export const Registry = {
  total(root: Doc) {
    return Registry.get(root)?.total || 0;
  },

  exists(root: Doc | Id) {
    const id = typeof root === 'string' ? root : root.uri.toString();
    return store.has(id);
  },

  get(root: Doc) {
    return store.get(root.uri.toString());
  },

  add(root: Doc) {
    const uri = root.uri.toString();
    if (Registry.exists(uri)) {
      const entry = store.get(uri)!;
      const total = entry.total + 1;
      store.set(uri, { ...entry, total });
    } else {
      store.set(uri, { total: 1 });
    }
    return store.get(uri)!;
  },

  remove(root: Doc) {
    const uri = root.uri.toString();
    const entry = store.get(uri);
    if (!entry) return;

    const total = entry.total - 1;
    if (total <= 0) {
      store.delete(uri);
    } else {
      store.set(uri, { ...entry, total });
    }
  },
};
