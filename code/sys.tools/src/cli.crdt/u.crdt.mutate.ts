import { type t, c } from './common.ts';

export function setWatchingName(d: t.CrdtIndexDoc, docid?: string, name?: string) {
  const list = d.watching || (d.watching = []);

  const idx = list.findIndex((x) => x.docid === docid);
  if (idx >= 0) {
    const curr = list[idx];

    if (curr.name !== name) {
      const from = curr.name;
      const to = name;

      // Log with correct closing paren and cyan highlight when present.
      const msg = `Updated name: from ${from ?? '(none)'} to ${to ? c.cyan(to) : '(none)'}`;
      console.info(c.gray(msg));

      // 2) Automerge-safe write: never store undefined; delete the key instead.
      if (to == null) {
        delete (list[idx] as { name?: string }).name;
      } else {
        list[idx].name = to;
      }
    }
  }
}

export function removeEmpty(d: t.CrdtIndexDoc) {
  const list = d.watching || (d.watching = []);
  if (list.length === 0) return;

  // Remove items that have no valid docid (undefined, empty string, or non-string)
  for (let i = list.length - 1; i >= 0; i--) {
    const item = list[i];
    if (!item?.docid || typeof item.docid !== 'string' || item.docid.trim() === '') {
      list.splice(i, 1);
    }
  }
}
