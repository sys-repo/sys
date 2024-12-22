import { type t, ensureDir, exists } from './common.ts';
import { Is } from './m.Is.ts';
import { Path } from './m.Path.ts';
import { Size } from './m.Size.ts';
import { Watch } from './m.Watch.ts';
import { copy, copyDir, copyFile } from './u.copy.ts';
import { glob, ls } from './u.glob.ts';
import { readJson } from './u.read.ts';
import { remove } from './u.remove.ts';
import { walk, walkUp } from './u.walk.ts';
import { write } from './u.write.ts';

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
  cwd: Deno.cwd,

  join,
  resolve,
  basename,
  dirname,

  glob,
  ls,
  exists,
  ensureDir,
  remove,
  readJson,

  write,
  copy,
  copyDir,
  copyFile,

  walk,
  walkUp,
  watch: Watch.start,
} as const;
