import type { t } from './common.ts';
import { ensureDir, ensureSymlink, exists, ls, move, Path } from './common.ts';

import { FsCapability } from '../m.Fs.capability/mod.ts';
import { create as glob } from '../m.Glob/u.create.ts';
import { Watch } from '../m.Watch/mod.ts';
import { Fmt } from './m.Fmt.ts';
import { Is } from './m.Is.ts';
import { Size } from './m.Size.ts';
import { Tilde } from './m.Tilde.ts';
import { copy, copyDir, copyFile } from './u.copy.ts';
import { cwd } from './u.cwd.ts';
import { makeTempDir } from './u.makeTmpDir.ts';
import { read, readJson, readText, readYaml } from './u.read.ts';
import { remove } from './u.remove.ts';
import { resolve } from './u.resolve.ts';
import { stat } from './u.stat.ts';
import { toDir } from './u.toDir.ts';
import { toFile } from './u.toFile.ts';
import { walk, walkUp } from './u.walk.ts';
import { write, writeJson } from './u.write.ts';

export { Path };
const { join, basename, dirname, extname } = Path;

/**
 * Filesystem helpers.
 */
export const Fs: t.Fs.Lib = {
  get Is() {
    return Is;
  },
  get Path() {
    return Path;
  },
  get Size() {
    return Size;
  },
  get Watch() {
    return Watch;
  },
  get Fmt() {
    return Fmt;
  },
  get Tilde() {
    return Tilde;
  },
  get Capability() {
    return FsCapability;
  },

  stat,
  cwd,
  trimCwd: Path.trimCwd,
  realPath: Deno.realPath,

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
  move,
  makeTempDir,

  walk,
  walkUp,
  watch: Watch.start,
};
