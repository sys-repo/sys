import { type t, A, CrdtIs } from './common.ts';

export function getStats(doc: A.Doc<unknown>): t.DocumentStats {
  if (!CrdtIs.ref(doc))
    // NB: Cannot calculate stats on a worker-proxy document.
    // Future: calculate on the worker via a command.
    return {
      bytes: -1,
      total: { changes: -1, ops: -1 },
    };

  const bytes = A.save(doc).byteLength;
  const s = A.stats(doc);
  return {
    bytes,
    total: { changes: s.numChanges, ops: s.numOps },
  };
}
