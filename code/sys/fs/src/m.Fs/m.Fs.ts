import { create as glob } from '../m.Glob/u.create.ts';
import { ls } from '../m.Glob/u.ls.ts';
import { Watch } from '../m.Watch/mod.ts';
import { type t, ensureDir, exists, Path } from './common.ts';
import { Is } from './m.Is.ts';
import { Size } from './m.Size.ts';
import { copy, copyDir, copyFile } from './u.copy.ts';
import { readJson } from './u.read.ts';
import { remove } from './u.remove.ts';
import { walk, walkUp } from './u.walk.ts';
import { write, writeJson } from './u.write.ts';

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
  trimCwd: Path.trimCwd,

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
  writeJson,
  copy,
  copyDir,
  copyFile,

  walk,
  walkUp,
  watch: Watch.start,
} as const;
