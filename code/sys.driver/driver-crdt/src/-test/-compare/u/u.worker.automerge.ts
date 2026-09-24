import { getActorId, getCursor, save } from '@automerge/automerge';
import { Repo } from '@automerge/automerge-repo';
import { initialNote } from '../../-fixtures/u.note.ts';
import { type t } from '../common.ts';
import { authorAutomerge, captureAutomerge } from './u.automerge.ts';
import { serve } from './u.host.ts';

// Repo belongs only to this worker entry; the caller's replica never instantiates/imports Repo.
const repo = new Repo({ network: [] });
const handle = repo.create<t.FixtureNote>(initialNote());
const selection = [getCursor(handle.doc(), ['text'], 0), getCursor(handle.doc(), ['text'], 1)];
serve({
  writer: getActorId(handle.doc()),
  capture: () => captureAutomerge(handle.doc(), selection),
  save: () => save(handle.doc()),
  apply: (binary) => {
    repo.import(binary, { docId: handle.documentId });
  },
  author: (fn) => handle.change((draft) => authorAutomerge(draft, fn)),
  dispose: () => repo.shutdown(),
});
