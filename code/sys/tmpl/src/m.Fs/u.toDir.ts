import { type t, Fs, Path } from './common.ts';
import { toFile } from './u.toFile.ts';

/**
 * Convert a path into a {TmplDir} data structure.
 */
export function toDir(dir: t.StringDir, filters?: t.TmplFilter[]): t.TmplDir {
  const absolute = Path.resolve(dir);
  return {
    absolute,
    toString: () => absolute,
    join: (...parts) => Path.join(absolute, ...parts),
    async ls(trimCwd) {
      const files = await Fs.glob(dir, { includeDirs: false }).find('**');
      const include = (p: string) => {
        if (!filters) return true;
        const file = toFile(absolute, p);
        return filters.every((filter) => filter(file));
      };
      return files
        .filter((p) => include(p.path))
        .map((p) => (trimCwd ? Path.trimCwd(p.path) : p.path));
    },
  };
}
