import type { t } from './common.ts';

/**
 * Public helpers for SlugClient URL generation.
 */
export const SlugUrl: t.SlugClientUrlLib = {
  clean(docid: string | t.Crdt.Id) {
    return String(docid)
      .trim()
      .replace(/^crdt\:/, '');
  },
};
