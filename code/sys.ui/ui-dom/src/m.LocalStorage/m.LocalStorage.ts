import type { t } from '../common.ts';

/**
 * Helper for working with a strongly typed local-storage object.
 */
export const LocalStorage: t.LocalStorageFactory = <T extends t.JsonMapU>(prefix: string) => {
  prefix = prefix.replace(/\/$/, '');
  const toKey = (name: keyof T) => `${prefix}/${String(name)}`;

  const local: t.LocalStorage<T> = {
    prefix,

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
};
