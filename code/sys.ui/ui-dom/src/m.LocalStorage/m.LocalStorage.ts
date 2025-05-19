import { type t, Immutable } from '../common.ts';

/**
 * Helpers for working with a strongly typed local-storage object.
 */
export const LocalStorage: t.LocalStorageLib = {
  /**
   * Factory:
   */
  ns<T extends t.JsonMapU>(namespace: string): t.LocalStorage<T> {
    namespace = namespace.replace(/\/+$/, '');
    const toKey = (name: keyof T) => `${namespace}/${String(name)}`;

    const local: t.LocalStorage<T> = {
      namespace,

      get<K extends keyof T>(key: K, defaultValue: T[K]) {
        const value = localStorage.getItem(toKey(key));
        if (value === null) return defaultValue;
        return JSON.parse(value).value as T[K];
      },

      put<K extends keyof T>(key: K, value: T[K]) {
        const json = JSON.stringify({ value });
        localStorage.setItem(toKey(key), json);
        return value;
      },

      delete<K extends keyof T>(key: K) {
        localStorage.removeItem(toKey(key));
      },

      clear() {
        Object.keys(localStorage).forEach((key) => local.delete(key));
      },

      object(initial: T): T {
        const obj = {} as T;
        Object.keys(initial).forEach((key) => {
          Object.defineProperty(obj, key, {
            get: () => local.get(key, initial[key] as any),
            set: (value) => local.put(key, value),
            enumerable: true,
          });
        });
        return obj;
      },
    };

    return local;
  },

  /**
   * Factory: Immutable<T> interface to local-storage.
   */
  immutable<T extends t.JsonMapU>(key: string, initial: T, dispose$?: t.UntilInput) {
    key = String(key);
    const existing = localStorage.getItem(key);
    const save = (obj: T) => localStorage.setItem(key, JSON.stringify(obj));
    if (!existing) save(initial);

    const obj = Immutable.clonerRef<T>(existing ? JSON.parse(existing) : initial);
    obj.events(dispose$).changed$.subscribe((e) => save(e.after));
    return obj;
  },
};
