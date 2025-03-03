import { type t, ensureDir, exists, ls, Path, ensureSymlink } from './common.ts';

import { create as glob } from '../m.Glob/u.create.ts';
import { Watch } from '../m.Watch/mod.ts';
import { Is } from './m.Is.ts';
import { Size } from './m.Size.ts';
import { copy, copyDir, copyFile } from './u.copy.ts';
import { read, readJson, readText, readYaml } from './u.read.ts';
import { remove } from './u.remove.ts';
import { toDir } from './u.toDir.ts';
import { toFile } from './u.toFile.ts';
import { walk, walkUp } from './u.walk.ts';
import { write, writeJson } from './u.write.ts';

export { Path };
const { join, resolve, basename, dirname, extname } = Path;

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

  dirname,
  basename,
  extname,

  glob,
  ls,
  toFile,
  toDir,

  exists,
  ensureDir,
  ensureSymlink,
  remove,

  read,
  readText,
  readJson,
  readYaml,

  write,
  writeJson,
  copy,
  copyDir,
  copyFile,

  walk,
  walkUp,
  watch: Watch.start,
} as const;
