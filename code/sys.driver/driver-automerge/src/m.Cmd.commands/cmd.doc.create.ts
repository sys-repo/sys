import { type t } from './common.ts';

type O = Record<string, unknown>;
type H = t.CrdtCmdHandlers;

/**
 * Create a new document in the repo and return its id.
 */
export function makeDocCreateHandler(getRepo: t.CrdtGetRepoInput): H['doc:create'] {
  return async (params) => {
    const repo = getRepo();

    // Environment checks:
    if (!repo) throw new Error('No repo to operate on.');

    const initial: O = params.initial ?? {};
    const created = await repo.create(initial);
    if (!created.ok || !created.doc) {
      throw new Error(`create failed: ${created.error?.message ?? 'unknown error'}`);
    }

    return { doc: created.doc.id };
  };
}
