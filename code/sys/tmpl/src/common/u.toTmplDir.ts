import type * as t from './t.ts';

import { Fs, Path } from './libs.ts';
import { toTmplFile } from './u.toTmplFile.ts';

/**
 * Convert a path into a {TmplDir} data structure.
 */
export function toTmplDir(dir: t.StringDir, filters?: t.TmplFilter[]): t.TmplDir {
  const path = Path.resolve(dir);
  return {
    path,
    join: (...parts) => Path.join(path, ...parts),
    async ls(trimCwd) {
      const files = await Fs.glob(dir, { includeDirs: false }).find('**');
      const include = (p: string) => {
        if (!filters) return true;
        const file = toTmplFile(path, p);
        return filters.every((filter) => filter(file));
      };
      return files
        .filter((p) => include(p.path))
        .map((p) => (trimCwd ? Path.trimCwd(p.path) : p.path));
    },
  };
}
