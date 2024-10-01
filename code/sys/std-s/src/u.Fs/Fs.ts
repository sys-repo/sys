import { Path, type t } from './common.ts';

import { ensureDir, exists } from '@std/fs';
import { copyDir, removeDir } from './u.dir.ts';
import { glob } from './u.glob.ts';

const { join, resolve } = Path;

/**
 * Filesystem helpers.
 */
export const Fs: t.FsLib = {
  Path,
  exists,
  ensureDir,
  glob,
  join,
  resolve,
  copyDir,
  removeDir,
} as const;
