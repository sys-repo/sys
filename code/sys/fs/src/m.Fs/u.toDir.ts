import { type t, ls, StdPath } from './common.ts';
import { toFile } from './u.toFile.ts';

/**
 * Convert a path into a `FsDir` data-structure.
 */
export const toDir: t.FsDirFactory = (path, opt) => {
  const baseOptions = wrangle.options(opt);
  const absolute = StdPath.resolve(path);
  return {
    absolute,
    toString: () => absolute,
    join: (...parts) => StdPath.join(absolute, ...parts),
    async ls(input) {
      const options = wrangle.lsOptions(input);
      const { trimCwd } = options;
      const hasFilters = !!(baseOptions.filter || options.filter);

      const include = (p: string) => {
        const file = toFile(p, absolute);
        if (options.filter && !options.filter(file)) return false;
        if (baseOptions.filter) {
          for (const fn of wrangle.filters(baseOptions.filter)) {
            if (!fn(file)) return false;
          }
        }
        return true;
      };

      const paths = await ls(absolute, { trimCwd, includeDirs: false });
      return hasFilters ? paths.filter((p) => include(p)) : paths;
    },
  };
};

/**
 * Helpers
 */
const wrangle = {
  options(input?: Parameters<t.FsDirFactory>[1]): t.FsDirFactoryOptions {
    if (!input) return {};
    const isFunc = typeof input === 'function';
    if (isFunc || Array.isArray(input)) return { filter: wrangle.filters(input) };
    return input;
  },

  filters(input?: t.FsFileFilter | t.FsFileFilter[]): t.FsFileFilter[] {
    if (!input) return [];
    if (typeof input === 'function') return [input];
    if (Array.isArray(input)) return input.filter((fn) => typeof fn === 'function');
    return [];
  },

  lsOptions(input?: Parameters<t.FsDir['ls']>[0]): t.FsDirListOptions {
    if (!input) return {};
    if (typeof input === 'function') return { filter: input };
    return input;
  },
} as const;
