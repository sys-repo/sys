import { exists } from '@std/fs';
import { copyDir, removeDir } from './u.Fs.dir.ts';
import { glob } from './u.Fs.glob.ts';
import { Path } from './u.Path.ts';

export { Path };

/**
 * Filesystem helpers.
 */
export const Fs = {
  ...Path,
  Path,
  exists,
  glob,
  copyDir,
  removeDir,
} as const;
