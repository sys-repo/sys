import { type t, A } from './common.ts';

export function getStats(doc: A.Doc<unknown>): t.DocumentStats {
  const bytes = A.save(doc).byteLength;
  const s = A.stats(doc);
  return {
    bytes,
    total: { changes: s.numChanges, ops: s.numOps },
  };
}
