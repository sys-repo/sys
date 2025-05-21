import { type t, Is } from './common.ts';

type DocsInput = t.StoreIndex | t.StoreIndexDoc | t.StoreIndexItem[];

/**
 * Filters on a store's [Index].
 */
export const Filter = {
  /**
   * Filter a set of docs within the index.
   */
  docs(input: DocsInput, filter?: t.StoreIndexFilter) {
    const docs = wrangle.docs(input);
    return !filter ? docs : docs.filter((doc, index) => filter({ doc, index }, index));
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  docs(docs: DocsInput): t.StoreIndexItem[] {
    if (Array.isArray(docs)) return docs;
    if (Is.storeIndex(docs)) return docs.doc.current.docs;
    if (Array.isArray(docs.docs)) return docs.docs;
    return [];
  },
} as const;
