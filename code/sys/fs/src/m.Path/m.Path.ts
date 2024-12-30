import { type t, exists, isDir, StdPath } from './common.ts';

type L = t.FsPathLib;

/**
 * Helpers for working with resource paths with the
 * existence of the server FS tools.
 */
export const Path: L = {
  ...StdPath,

  async asDir(path) {
    if (!(await exists(path))) return path;
    return (await isDir(path)) ? path : StdPath.dirname(path);
  },

  cwd: Deno.cwd,
  trimCwd(path, opt) {
    const { prefix = false, cwd = Deno.cwd() } = wrangle.trimCwdOptions(opt);
    if (typeof path !== 'string') return '';
    if (StdPath.Is.relative(path)) {
      return wrangle.relativePrefix(path, prefix);
    } else {
      if (path.startsWith(cwd)) path = path.slice(cwd.length + 1);
      return wrangle.relativePrefix(path, prefix);
    }
  },
};

/**
 * Helpers
 */
const wrangle = {
  relativePrefix(path: string, prefix: boolean): string {
    if (!StdPath.Is.relative(path)) return path;
    path = path.replace(/^\.\//, '');
    return prefix ? `./${path}` : path;
  },

  trimCwdOptions(input: Parameters<L['trimCwd']>[1]): t.FsPathTrimCwdOptions {
    if (!input) return {};
    if (typeof input === 'boolean') return { prefix: input };
    return input;
  },
} as const;
