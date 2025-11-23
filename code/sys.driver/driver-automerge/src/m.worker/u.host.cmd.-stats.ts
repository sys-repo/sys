import { A, type t, toAutomergeHandle } from './common.ts';

const EMPTY_STATS: t.DocumentStats = {
  bytes: -1,
  total: { changes: -1, ops: -1 },
};

export function makeStats(
  getRepo: () => t.Crdt.Repo | undefined,
): t.CrdtWorkerCmdHandlers['stats'] {
  return async ({ doc }) => {
    const repo = getRepo();
    if (!repo) return EMPTY_STATS;

    const result = await repo.get(doc as t.StringId);
    if (!result.ok || !result.doc) return EMPTY_STATS;

    const handle = toAutomergeHandle(result.doc);
    if (!handle) return EMPTY_STATS;

    const am = handle.doc;

    const bytes = A.save(am).byteLength;
    const s = A.stats(am);

    return {
      bytes,
      total: {
        changes: s.numChanges,
        ops: s.numOps,
      },
    } satisfies t.DocumentStats;
  };
}
