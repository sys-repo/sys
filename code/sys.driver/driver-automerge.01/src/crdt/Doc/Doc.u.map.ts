import { Immutable, type t } from './common.ts';

type O = Record<string, unknown>;
type P = t.DocMapPatch;

/**
 * Create a new composite proxy that maps to an underlying document(s).
 */
export function map<T extends O>(mapping: t.ImmutableMapping<T, P>): t.DocMap<T> {
  return Immutable.map<T, P>(mapping, {
    /**
     * Augment the [Automerge Patch] with the mapping meta-data.
     */
    formatPatch(e) {
      const doc = (e.doc as t.Doc).uri ?? '';
      const key = e.key;
      return {
        ...e.patch,
        mapping: { key, doc },
      } as P;
    },
  });
}
