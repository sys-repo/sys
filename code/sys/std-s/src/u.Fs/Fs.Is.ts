import { exists } from '@std/fs';
import { Path, type t } from './common.ts';

/**
 * Filesystem/Path type verification flags.
 */
export const Is: t.FsIs = {
  ...Path.Is,

  /**
   * Determine if the given path points to a directory.
   */
  async dir(path) {
    if (!(await exists(path))) return false;
    return (await Deno.stat(path)).isDirectory;
  },
} as const;
