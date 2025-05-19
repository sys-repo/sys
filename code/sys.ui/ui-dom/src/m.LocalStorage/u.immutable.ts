import { type t, Immutable } from '../common.ts';

/**
 * Factory: Immutable<T> interface to local-storage.
 */
export function immutable<T extends t.JsonMapU>(key: string, initial: T, dispose$?: t.UntilInput) {
  key = String(key);
  const existing = localStorage.getItem(key);
  const save = (obj: T) => localStorage.setItem(key, JSON.stringify(obj));
  if (!existing) save(initial);

  const obj = Immutable.clonerRef<T>(existing ? JSON.parse(existing) : initial);
  obj.events(dispose$).changed$.subscribe((e) => save(e.after));
  return obj;
}
