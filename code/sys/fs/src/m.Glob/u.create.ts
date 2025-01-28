import { type WalkEntry, expandGlob } from '@std/fs';
import { type t, Path } from './common.ts';

/**
 * Run a glob pattern against the file-system.
 */
export const create: t.GlobFactory = (dir = '.', baseOptions = {}) => {
  dir = Path.resolve(dir);

  const api: t.Glob = {
    get base() {
      return dir;
    },

    async find(pattern, options = {}): Promise<WalkEntry[]> {
      const { exclude, includeDirs, trimCwd, depth } = { ...baseOptions, ...options };
      pattern = Path.join(dir, pattern);
      const res: WalkEntry[] = [];
      const expanded = expandGlob(pattern, { exclude, includeDirs });
      for await (const file of expanded) {
        if (typeof depth === 'number') {
          const path = file.path.slice(dir.length + 1);
          if (path.split('/').length > depth) continue;
        }

        if (trimCwd) file.path = Path.trimCwd(file.path);
        res.push(file);
      }
      return res;
    },

    dir(subdir, options = {}) {
      const path = Path.join(dir, subdir);
      return create(path, { ...baseOptions, ...options }); // ← RECURSION 🌳
    },
  };
  return api;
};
