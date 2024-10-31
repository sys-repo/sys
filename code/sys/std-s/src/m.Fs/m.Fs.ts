import { ensureDir, exists } from '@std/fs';

import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { Path } from './m.Path.ts';
import { Size } from './m.Size.ts';
import { Watch } from './m.Watch.ts';
import { copyDir } from './u.dir.ts';
import { glob } from './u.glob.ts';
import { readJson } from './u.read.ts';
import { remove } from './u.remove.ts';
import { walk, walkUp } from './u.walk.ts';

export { Path };
const { join, resolve, basename, dirname } = Path;

/**
 * Filesystem helpers.
 */
export const Fs: t.FsLib = {
  Is,
  Path,
  Size,
  Watch,
  stat: Deno.stat,

  join,
  resolve,
  basename,
  dirname,

  glob,
  exists,
  ensureDir,
  copyDir,
  remove,
  readJson,

  walk,
  walkUp,
  watch: Watch.start,
} as const;
