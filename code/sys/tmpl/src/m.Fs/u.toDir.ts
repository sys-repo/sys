import { type t, Fs, Path } from './common.ts';
import { toFile } from './u.toFile.ts';

/**
 * Convert a path into a {TmplDir} data structure.
 */
export function toDir(dir: t.StringDir, filters?: t.FsFileFilter[]): t.FsDir {
  const absolute = Path.resolve(dir);
  return {
    absolute,
    toString: () => absolute,
    join: (...parts) => Path.join(absolute, ...parts),
    async ls(input) {
      const options = wrangle.lsOptions(input);
      const { trimCwd } = options;
      const hasFilters = !!(filters || options.filter);

      const include = (p: string) => {
        const file = toFile(p, absolute);
        if (options.filter && !options.filter(file)) return false;
        if (filters) {
          for (const fn of filters) {
            if (!fn(file)) return false;
          }
        }
        return true;
      };

      const paths = await Fs.ls(absolute, { trimCwd, includeDirs: false });
      return hasFilters ? paths.filter((p) => include(p)) : paths;
    },
  };
}

/**
 * Helpers
 */
const wrangle = {
  lsOptions(input?: Parameters<t.FsDir['ls']>[0]): t.FsDirListOptions {
    if (!input) return {};
    if (typeof input === 'function') return { filter: input };
    return input;
  },
} as const;
