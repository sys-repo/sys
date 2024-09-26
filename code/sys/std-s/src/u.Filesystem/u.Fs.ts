import { exists } from '@std/fs';
import { copyDir } from './u.Fs.cp.ts';
import { glob } from './u.Fs.glob.ts';
import { Path } from './u.Path.ts';

export { Path };

/**
 * Filesystem helpers.
 */
export const Fs = {
  ...Path,
  exists,
  Path,
  glob,
  copyDir,
  remove: Deno.remove,
} as const;
