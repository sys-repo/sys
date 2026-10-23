import {
  applyUpdate,
  createAbsolutePositionFromRelativePosition,
  createRelativePositionFromTypeIndex,
  Doc,
  encodeSnapshot,
  encodeStateAsUpdate,
  Map as YMap,
  snapshot,
} from 'yjs';
import { Err, Json, Obj, type t } from '../common.ts';
import { initialNote } from '../../-fixtures/u.note.ts';
import { projectYjs } from '../../-fixtures/u.yjs.ts';

/** A fixed shared-type schema. No ordinary-object draft mapping or exposed mutable Y.Doc. */
export function yjsNative(seed?: Uint8Array): t.Native {
  const doc = new Doc();
  const text = doc.getText('text');
  const meta = doc.getMap<string>('meta');
  const items = doc.getArray<YMap<string>>('items');
  const item = (value: t.FixtureNote['items'][number]) =>
    new YMap<string>([
      ['id', value.id],
      ['label', value.label],
    ]);
  if (seed) applyUpdate(doc, seed);
  else {
    const initial = initialNote();
    doc.transact(() => {
      meta.set('title', initial.title);
      items.push(initial.items.map(item));
      text.insert(0, initial.text);
    });
  }
  const selection = [0, 1].map((index) => createRelativePositionFromTypeIndex(text, index));
  let authoring = false;
  return {
    writer: String(doc.clientID),
    capture: () => ({
      value: projectYjs(doc),
      // Includes the delete set: an insertion state vector alone misses delete-only changes.
      basis: Json.stringify([...encodeSnapshot(snapshot(doc))]),
      metadata: Obj.clone(text.toDelta()),
      selection: selection.map((position) => {
        const absolute = createAbsolutePositionFromRelativePosition(position, doc);
        if (!absolute) throw Err.std('Fixture selection no longer resolves.');
        return absolute.index;
      }),
    }),
    save: () => encodeStateAsUpdate(doc),
    apply: (binary) => applyUpdate(doc, binary),
    author(fn) {
      if (authoring) throw Err.std('Reentrant native author is unsupported.');
      authoring = true;
      let active = true;
      const within = (action: () => void) => {
        if (!active) throw Err.std('Fixture author is outside its native transaction.');
        action();
      };
      try {
        doc.transact(() =>
          fn({
            title: (value) =>
              within(() => {
                meta.set('title', value);
              }),
            label: (index, value) =>
              within(() => {
                items.get(index).set('label', value);
              }),
            insertItem: (index, value) => within(() => items.insert(index, [item(value)])),
            insertText: (index, value) => within(() => text.insert(index, value)),
            deleteText: (index, count) => within(() => text.delete(index, count)),
            format: (start, end, bold) => within(() => text.format(start, end - start, { bold })),
          })
        );
      } finally {
        active = false;
        authoring = false;
      }
    },
    dispose: () => doc.destroy(),
  };
}
