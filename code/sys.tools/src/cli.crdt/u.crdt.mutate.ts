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
