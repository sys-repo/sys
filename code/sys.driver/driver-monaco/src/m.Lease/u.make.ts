import { type t } from './common.ts';

export function make<K, T extends string = string>(): t.LeaseMap<K, T> {
  const map = new Map<K, T>();
  return {
    get size() {
      return map.size;
    },
    claim(key, token) {
      map.set(key, token);
    },
    release(key, token) {
      if (map.get(key) === token) map.delete(key);
    },
    isOwner(key, token) {
      return map.get(key) === token;
    },
    current(key) {
      return map.get(key);
    },
  };
}
