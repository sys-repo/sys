import { type t, Is, Fs } from './common.ts';
import { get } from './u.get.ts';

const pool = new Map<t.StringPath, t.JsonFile>();

/**
 * Singleton pool API for JsonFile handles.
 */
export const Singleton: t.JsonFileSingletonLib = {
  async get<D extends t.JsonFileDoc = t.JsonFileDoc>(
    path: t.StringPath,
    initial?: D | (() => D),
  ): Promise<t.JsonFile<D>> {
    const resolved = Fs.resolve(path);
    const existing = pool.get(resolved);
    if (existing) return existing as t.JsonFile<D>;

    if (initial === undefined) {
      const msg = `JsonFile.Singleton.get: no instance for path "${resolved}" and no initial value provided.`;
      throw new Error(msg);
    }

    const value = Is.func(initial) ? (initial as () => D)() : initial;
    const file = await get<D>(resolved, value);
    pool.set(resolved, file);
    return file;
  },

  keys() {
    return Array.from(pool.keys());
  },

  entries() {
    return Array.from(pool.entries());
  },

  clear() {
    pool.clear();
  },
};
