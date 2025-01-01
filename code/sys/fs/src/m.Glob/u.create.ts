import { type WalkEntry, expandGlob } from '@std/fs';
import { type t, Path } from './common.ts';

/**
 * Run a glob pattern against the file-system.
 */
export const create: t.GlobFactory = (dir, baseOptions = {}) => {
  dir = Path.resolve(dir);
  const api: t.Glob = {
    get base() {
      return dir;
    },

    async find(pattern, options = {}): Promise<WalkEntry[]> {
      const { exclude, includeDirs } = { ...baseOptions, ...options };
      pattern = Path.join(dir, pattern);
      const res: WalkEntry[] = [];
      const expanded = expandGlob(pattern, { exclude, includeDirs });
      for await (const file of expanded) {
        res.push(file);
      }
      return res;
    },

    dir(subdir) {
      return create(Path.join(dir, subdir)); // ← RECURSION 🌳
    },
  };
  return api;
};
