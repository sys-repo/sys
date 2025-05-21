import { A, type t } from './common.ts';

export const Wrangle = {
  /**
   * The shared object (or default) on an index item.
   */
  shared(item: t.StoreIndexItem) {
    if (typeof item.shared !== 'object') {
      item.shared = { current: false, version: new A.Counter(0) };
    }
    return item.shared!;
  },
} as const;
