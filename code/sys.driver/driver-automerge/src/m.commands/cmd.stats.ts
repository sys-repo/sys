import { type t, A, toAutomergeHandle } from './common.ts';

export function makeStatsHandler(
  getRepo: () => t.Crdt.Repo | undefined,
): t.CrdtCmdHandlers['stats'] {
  return async (params) => {
    const repo = getRepo();
    if (!repo) return EMPTY.stats;

    const { ok, doc } = await repo.get(params.doc);
    if (!ok || !doc) return EMPTY.stats;

    const handle = toAutomergeHandle(doc);
    if (!handle) return EMPTY.stats;

    try {
      const root = handle.doc();
      const bytes = A.save(root).byteLength;
      const s = A.stats(root);

      return {
        bytes,
        total: { changes: s.numChanges, ops: s.numOps },
      } satisfies t.DocumentStats;
    } catch {
      return EMPTY.stats;
    }
  };
}

/**
 * Helpers:
 */
const EMPTY = {
  get stats(): t.DocumentStats {
    return {
      bytes: -1,
      total: { changes: -1, ops: -1 },
    };
  },
};
