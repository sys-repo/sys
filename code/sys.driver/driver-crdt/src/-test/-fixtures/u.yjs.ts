import { applyUpdate, Doc, encodeStateAsUpdate, Map as YMap } from 'yjs';
import { Err, Is, type t } from '../common.ts';
import { initialNote } from './u.note.ts';

/** Separate writers share native update history, never independently seeded lookalike values. */
export function yjsPair() {
  const owner = new Doc();
  const peer = new Doc();
  const seed = initialNote();
  owner.transact(() => {
    owner.getMap<string>('meta').set('title', seed.title);
    owner.getArray<YMap<string>>('items').push(seed.items.map((item) => {
      const shared = new YMap<string>();
      shared.set('id', item.id);
      shared.set('label', item.label);
      return shared;
    }));
    owner.getText('text').insert(0, seed.text);
  });
  applyUpdate(peer, encodeStateAsUpdate(owner));
  return {
    owner,
    peer,
    [Symbol.dispose]() {
      owner.destroy();
      peer.destroy();
    },
  };
}

/** Explicit schema projection only: neither an arbitrary draft mapper nor all native state. */
export function projectYjs(doc: Doc): t.FixtureNote {
  return {
    title: requiredString(doc.getMap<string>('meta'), 'title'),
    items: doc.getArray<YMap<string>>('items').toArray().map((item) => ({
      id: requiredString(item, 'id'),
      label: requiredString(item, 'label'),
    })),
    text: doc.getText('text').toString(),
  };
}

/** Missing fixture fields must fail loudly instead of projecting plausible empty values. */
function requiredString(map: YMap<string>, key: string): string {
  const value = map.get(key);
  if (!Is.str(value)) throw Err.std(`Fixture field '${key}' is not a string.`);
  return value;
}
