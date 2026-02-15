import type { t } from './common.ts';

export function cleanDocid(docid: t.StringId): t.StringId {
  return String(docid)
    .trim()
    .replace(/^crdt\:/, '');
}
