import { type t } from './common.ts';

type Options = Parameters<t.HistoryLib['stack']>[0];

export function stack(options: Options = {}): t.HistoryStack {
  const { max = Number.POSITIVE_INFINITY } = options;

  const items = options.items ?? [];
  const handlers = new Set<t.HistoryStackChangeHandler>();
  let index: number | null = null; // null ⇢ live prompt (not in history).

  const notify = (before: string[]) => {
    const index = api.index;
    const after = [...items];
    handlers.forEach((fn) => fn({ index, before, after }));
  };

  /**
   * Methods:
   */
  const push = (line: string) => {
    const value = line.trim();
    if (!value) return; // Ignore blanks.

    const before = [...items];
    const dup = items.indexOf(value);
    if (dup > -1) items.splice(dup, 1); //   ← De-dupe previous instance.

    items.unshift(value); //                 ← Newest ⇢ <head>.
    if (items.length > max) items.pop(); //  ← Enforce cap.
    api.reset(); //                          ← Reset navigation cursor.

    notify(before);
  };

  const remove = (line: string) => {
    line = line.trim();
    if (!line) return false;

    const index = items.indexOf(line);
    if (index === -1) return false;

    const before = [...items];
    items.splice(index, 1);

    notify(before);
    return true;
  };

  const back = (current?: string) => {
    if (!items.length) return undefined; //           Nothing stored.
    if (index === null) index = 0; //                 First <up> → newest entry.
    else if (index < items.length - 1) index += 1; // Step older - else stick on oldest (don't move past).

    // If the found items is the same as the provided "current" re-call back (recursion).
    if (current != null && current === items[index]) return back();
    return items[index];
  };

  const forward = () => {
    if (index === null) return undefined; // already at live prompt
    if (index > 0) {
      index -= 1; // Step newer.
      return items[index];
    }
    api.reset(); // Stepped past newest → live.
    return undefined;
  };

  /**
   * API:
   */
  const api: t.HistoryStack = {
    get items() {
      return items;
    },
    get index() {
      return index == null ? -1 : index;
    },
    get current() {
      return typeof index === 'number' ? items[index] : undefined;
    },
    push,
    remove,
    back,
    forward,
    onChange: (fn) => handlers.add(fn),
    reset: () => {
      if (index == null) return;
      const before = [...items];
      index = null;
      notify(before);
    },
  };
  return api;
}
