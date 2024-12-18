import { expandGlob, type WalkEntry } from '@std/fs';
import { Path, type t } from './common.ts';

/**
 * Run a glob pattern against the file-system.
 */
export function glob(...dir: (string | undefined)[]): t.Glob {
  const asStrings = (dir: (string | undefined)[]) => dir.filter(Boolean) as string[];
  const api: t.Glob = {
    get base() {
      return Path.join(...asStrings(dir));
    },

    async find(pattern, options = {}): Promise<WalkEntry[]> {
      const { exclude, includeDirs } = options;
      pattern = Path.join(...asStrings(dir), pattern);
      const res: WalkEntry[] = [];
      for await (const file of expandGlob(pattern, { exclude, includeDirs })) {
        res.push(file);
      }
      return res;
    },

    dir(...subdir) {
      return glob(Path.join(...asStrings(dir), ...asStrings(subdir)));
    },
  };
  return api;
}
