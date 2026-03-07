import type { t } from './common.ts';

export const Util: t.SlugUrlUtilLib = {
  cleanDocid(docid) {
    return String(docid)
      .trim()
      .replace(/^crdt\:/, '');
  },
};
