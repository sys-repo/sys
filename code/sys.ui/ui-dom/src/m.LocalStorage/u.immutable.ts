import { type t, Immutable, Is, Obj, pkg } from '../common.ts';

const REGISTRY_KEY = Symbol.for(`${pkg.name}:localStorageImmutable`);
const global = globalThis as any;

type Registry = Map<string, R>;
type R = t.LocalStorageImmutable<any>;
const registry: Registry = global[REGISTRY_KEY] ?? (global[REGISTRY_KEY] = new Map<string, R>());

/**
 * Factory: Immutable<T> interface to local-storage.
 */
export function immutable<T extends t.JsonMapU>(
  key: string,
  initial: T,
): t.LocalStorageImmutable<T> {
  type R = t.LocalStorageImmutable<T>;
  key = String(key);

  if (registry.has(key)) return registry.get(key) as t.LocalStorageImmutable<T>;

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

  const api = Immutable.clonerRef<T>(existing ? JSON.parse(existing) : initial);
  api.events().$.subscribe((e) => save(e.after));
  (api as any).reset = reset;

  registry.set(key, api as R);
  return api as R;
}
