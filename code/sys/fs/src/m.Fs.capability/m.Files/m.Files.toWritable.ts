import { type t } from '../common.ts';
import { readText, realPath } from '../u/u.Files.io.ts';
import { toPathCapability } from '../u/u.Files.path.ts';
import { stat, toFilesStat } from '../u/u.Files.stat.ts';
import { walk } from '../u/u.Files.walk.ts';
import { writeFileAtomic } from '../u/u.Files.atomic.ts';

/**
 * Adapt `@sys/fs` into the writable capability expected by `@sys/model/files/fs`.
 */
export const toWritable: t.FsCapability.Files.WritableLib['create'] = (fs) => {
  return Object.freeze({
    Path: toPathCapability(fs),
    realPath: (path) => realPath(fs, path),
    stat: (path) => stat(fs, path),
    readText: (path) => readText(fs, path),
    walk: (path) => walk(fs, path),
    lstat: async (path) => {
      const info = await fs.lstat(path);
      return info ? toFilesStat(info) : undefined;
    },
    ensureDir: (path) => fs.ensureDir(path),
    writeFileAtomic: (path, content, options) => writeFileAtomic(fs, path, content, options),
    removeEntry: async (path) => {
      const removed = await fs.remove(path, { recursive: false });
      if (!removed) throw new Error(`Path not found: ${path}`);
    },
  });
};
