import type { t } from '../common/mod.ts';

import { expandGlob, type WalkEntry } from '@std/fs';
import { Path } from './u.Path.ts';

/**
 * Run a glob pattern against the file-system.
 */
export function glob(...dir: (string | undefined)[]): t.Glob {
  const asStrings = (dir: (string | undefined)[]) => dir.filter(Boolean) as string[];
  return {
    async find(pattern, options = {}): Promise<WalkEntry[]> {
      const { exclude } = options;
      const res: WalkEntry[] = [];
      for await (const file of expandGlob(Path.join(...asStrings(dir), pattern), { exclude })) {
        res.push(file);
      }
      return res;
    },
    dir(...subdir) {
      return glob(Path.join(...asStrings(dir), ...asStrings(subdir)));
    },
  } as const;
}
