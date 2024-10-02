import { Path, type t } from './common.ts';

/**
 * Filesystem/Path type verification flags.
 */
export const Is: t.FsIs = {
  ...Path.Is,

  /**
   * Determine if the given path points to a directory.
   */
  dir: async (path) => (await Deno.stat(path)).isDirectory,
} as const;
