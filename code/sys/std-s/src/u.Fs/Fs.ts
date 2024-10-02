import { ensureDir, exists } from '@std/fs';

import { walk, walkUp } from './u.walk.ts';
import { Path, type t } from './common.ts';
import { copyDir, removeDir } from './u.dir.ts';
import { glob } from './u.glob.ts';
import { readJson } from './u.read.ts';
import { Is } from './Fs.Is.ts';

const { join, resolve } = Path;

/**
 * Filesystem helpers.
 */
export const Fs: t.FsLib = {
  Is,
  Path,
  join,
  resolve,

  glob,
  exists,
  ensureDir,
  copyDir,
  removeDir,
  readJson,

  walk,
  walkUp,
} as const;
