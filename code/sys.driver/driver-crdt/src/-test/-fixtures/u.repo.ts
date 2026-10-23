import { change, clone, free, getHeads, merge, save, splice } from '@automerge/automerge';
import { Repo } from '@automerge/automerge-repo';
import { Obj, type t } from '../common.ts';
import { initialNote } from './u.note.ts';

/** Native import witness only; run in a process that can drain Repo's unowned throttle tail. */
export async function repoImportControl() {
  const repo = new Repo({ network: [] });
  try {
    const handle = repo.create<t.FixtureNote>(initialNote());
    let peer = clone(handle.doc());
    try {
      handle.change((draft) => {
        draft.title = 'Owner title';
      });
      peer = change(peer, (draft) => splice(draft, ['text'], 1, 0, 'b'));
      const imported = repo.import<t.FixtureNote>(save(peer), { docId: handle.documentId });
      return {
        sameHandle: imported === handle,
        value: Obj.clone(handle.doc()),
        ownerHeads: getHeads(handle.doc()),
        mergedHeads: getHeads(merge(peer, handle.doc())),
      };
    } finally {
      free(peer);
    }
  } finally {
    // In 2.5.6 this does not await the synchronizer's 100 ms throttle timer.
    // No private flush, timer suppression, Deno.exit(), or guessed sleep is used.
    await repo.shutdown();
  }
}
