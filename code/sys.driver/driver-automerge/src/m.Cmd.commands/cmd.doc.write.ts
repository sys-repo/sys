import { type t, Obj } from './common.ts';

type H = t.CrdtCmdHandlers;

export function makeDocWriteHandler(getRepo: t.CrdtGetRepoInput): H['doc:write'] {
  return async (params) => {
    const repo = getRepo();
    if (!repo) throw new Error('No repo to operate on.');

    const { ok, doc } = await repo.get(params.doc);
    if (!ok || !doc) throw new Error(`Failed to load document for write (id: ${params.doc}).`);

    /**
     * `doc:write` only supports leaf writes at a non-empty path.
     * Root-write semantics are not part of this command.
     */
    const path = params.path ?? [];
    if (path.length === 0) throw new Error('doc:write requires a non-empty object path.');

    const lens = Obj.Lens.at(path);
    doc.change((d) => lens.set(d, params.value));

    return { ok: true };
  };
}
