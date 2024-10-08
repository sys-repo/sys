import { ensureDir, exists } from '@std/fs';

import type { t } from './common.ts';
import { Path } from './Fs.Path.ts';
import { Is } from './Fs.Is.ts';
import { copyDir, removeDir } from './u.dir.ts';
import { glob } from './u.glob.ts';
import { readJson } from './u.read.ts';
import { walk, walkUp } from './u.walk.ts';

export { Path };
const { join, resolve } = Path;

/**
 * Filesystem helpers.
 */
export const Fs: t.FsLib = {
  Is,
  Path,
  stat: Deno.stat,
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
