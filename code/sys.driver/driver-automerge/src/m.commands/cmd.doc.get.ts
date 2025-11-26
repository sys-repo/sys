import { type t } from './common.ts';

export function makeGetDocHandler(getRepo: t.CrdtGetRepoInput): t.CrdtCmdHandlers['doc:get'] {
  return async (params) => {
    const repo = getRepo();
    if (!repo) {
      return { doc: undefined };
    }

    const { ok, doc } = await repo.get(params.doc);
    if (!ok) {
      return { doc: undefined };
    }

    return { doc: doc ?? undefined };
  };
}
