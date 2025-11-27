import { type t } from './common.ts';

type H = t.CrdtCmdHandlers;

export function makeDocReadHandler(getRepo: t.CrdtGetRepoInput): H['doc:read'] {
  return async (params) => {
    const repo = getRepo();
    if (!repo) return { doc: undefined };

    const { ok, doc } = await repo.get(params.doc);
    if (!ok) return { doc: undefined };

    return { doc: doc ?? undefined };
  };
}
