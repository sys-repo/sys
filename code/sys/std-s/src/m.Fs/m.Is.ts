import { type t, exists, Path } from './common.ts';

/**
 * Filesystem/Path type verification flags.
 */
export const Is: t.FsIsLib = {
  ...Path.Is,

  /**
   * Determine if the given path points to a directory.
   */
  async dir(path) {
    try {
      if (!(await exists(path))) return false;
      return (await Deno.stat(path)).isDirectory;
    } catch (_error: any) {
      return false;
    }
  },
} as const;
