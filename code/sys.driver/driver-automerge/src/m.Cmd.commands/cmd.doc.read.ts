import { type t, Obj } from './common.ts';

type O = Record<string, unknown>;
type H = t.CrdtCmdHandlers;

export function makeDocReadHandler(getRepo: t.CrdtGetRepoInput): H['doc:read'] {
  return async (params) => {
    const repo = getRepo();
    if (!repo) return { value: undefined };

    const res = await repo.get(params.doc);
    if (!res.ok || !res.doc) return { value: undefined };

    const root = res.doc.current as O;
    const value = params.path ? Obj.Path.get<t.Json>(root, params.path) : (root as t.Json);

    return { value };
  };
}
