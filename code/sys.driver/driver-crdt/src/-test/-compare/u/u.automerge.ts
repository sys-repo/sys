import {
  change,
  clone,
  type Doc,
  emptyChange,
  free,
  getActorId,
  getCursor,
  getCursorPosition,
  getHeads,
  getObjectId,
  load,
  loadIncremental,
  mark,
  marks,
  merge,
  save,
  splice,
} from '@automerge/automerge';
import { Err, Json, Obj, type t } from '../common.ts';

/** Capture metadata now: querying marks on an old document later is not a historical snapshot. */
export function captureAutomerge(doc: Doc<t.FixtureNote>, selection: string[]): t.Snapshot {
  return {
    // Project this fixture schema explicitly: a general clone retains native document state.
    value: {
      title: doc.title,
      items: doc.items.map(({ id, label }) => ({ id, label })),
      text: doc.text,
    },
    basis: Json.stringify(getHeads(doc)),
    metadata: Obj.clone(marks(doc, ['text'])),
    selection: selection.map((cursor) => getCursorPosition(doc, ['text'], cursor)),
  };
}

/** Native operations stay inside one Automerge change callback. */
export function authorAutomerge(draft: t.FixtureNote, fn: (edit: t.Editor) => void) {
  fn({
    title: (value) => {
      draft.title = value;
    },
    label: (index, value) => {
      draft.items[index].label = value;
    },
    insertItem: (index, item) => {
      draft.items.splice(index, 0, item);
    },
    insertText: (index, value) => splice(draft, ['text'], index, 0, value),
    deleteText: (index, count) => splice(draft, ['text'], index, count, ''),
    format: (start, end, bold) =>
      mark(draft, ['text'], { start, end, expand: 'none' }, 'bold', bold),
  });
}

/** One independent native writer loaded from shared history, not a reconstructed value object. */
export function automergeReplica(seed: Uint8Array): t.Native {
  let doc = load<t.FixtureNote>(seed);
  const selection = [getCursor(doc, ['text'], 0), getCursor(doc, ['text'], 1)];
  const writer = getActorId(doc);
  let authoring = false;
  const author = (fn: t.ImmutableMutator<t.FixtureNote>) => {
    if (authoring) throw Err.std('Reentrant native author is unsupported.');
    // A retained upstream draft remains writable. Lend a native fork, never the retained backend.
    // Serialize this writer's authoring scopes so two forks cannot reuse its next actor sequence.
    const branch = clone(doc, { actor: writer });
    authoring = true;
    try {
      const next = change(branch, fn);
      // Cursors belong to the original text object, not merely its string value.
      // Reject the entire fork before it can alter the retained document/history.
      if (getObjectId(next, 'text') !== getObjectId(doc, 'text')) {
        throw Err.std(
          'Fixture text object replacement is unsupported. Use native text operations.',
        );
      }
      doc = merge(doc, next);
    } finally {
      authoring = false;
      free(branch);
    }
  };
  return {
    writer,
    capture: () => captureAutomerge(doc, selection),
    save: () => save(doc),
    apply: (binary) => {
      doc = loadIncremental(doc, binary);
    },
    author: (fn) => author((draft) => authorAutomerge(draft, fn)),
    change: author,
    headsOnly: () => {
      doc = emptyChange(doc, 'Heads-only fixture update');
    },
    dispose: () => free(doc),
  };
}
