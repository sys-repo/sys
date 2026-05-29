import { type t, Is, Fs } from './common.ts';
import { get } from './u.get.ts';

const pool = new Map<t.StringPath, t.JsonFile.Instance>();

/**
 * Singleton pool API for JsonFile handles.
 */
export const Singleton: t.JsonFile.Singleton.Lib = {
  async get<D extends t.JsonFile.Doc = t.JsonFile.Doc>(
    path: t.StringPath,
    initial?: D | (() => D),
    options: t.JsonFile.GetOptions = {},
  ): Promise<t.JsonFile.Instance<D>> {
    const resolved = Fs.resolve(path);
    const existing = pool.get(resolved);
    if (existing) return existing as t.JsonFile.Instance<D>;

    if (initial === undefined) {
      const msg = `JsonFile.Singleton.get: no instance for path "${resolved}" and no initial value provided.`;
      throw new Error(msg);
    }

    const value = Is.func(initial) ? (initial as () => D)() : initial;
    const file = await get<D>(resolved, value, options);
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
