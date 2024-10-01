import { ensureDir, exists } from '@std/fs';

import { Path, type t } from './common.ts';
import { copyDir, removeDir } from './u.dir.ts';
import { glob } from './u.glob.ts';
import { readJson } from './u.read.ts';

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
  readJson,
} as const;
