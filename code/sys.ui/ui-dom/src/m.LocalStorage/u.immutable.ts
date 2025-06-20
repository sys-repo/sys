import { type t, Immutable, Is, Obj } from '../common.ts';

/**
 * Factory: Immutable<T> interface to local-storage.
 */
export function immutable<T extends t.JsonMapU>(
  key: string,
  initial: T,
  dispose$?: t.UntilInput,
): t.LocalStorageImmutable<T> {
  type R = t.LocalStorageImmutable<T>;

  key = String(key);

  const save = (obj: T) => localStorage.setItem(key, JSON.stringify(obj));
  const reset = (input?: T) => {
    if (Is.object(input)) initial = input;
    api.change((d) => {
      Obj.entries(d).forEach(([key]) => delete d[key]);
      Obj.entries(initial).forEach(([key, value]) => (d[key] = value));
    });
  };

  let existing = localStorage.getItem(key);
  if (existing && !Is.json(existing)) existing = null;
  if (!existing) save(initial);

  const is: R['is'] = { new: existing === null };
  const api = Immutable.clonerRef<T>(existing ? JSON.parse(existing) : initial);
  api.events(dispose$).$.subscribe((e) => save(e.after));
  (api as any).reset = reset;
  (api as any).is = is;

  return api as R;
}
