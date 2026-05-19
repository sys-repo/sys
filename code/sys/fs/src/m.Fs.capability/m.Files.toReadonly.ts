import { type t } from './common.ts';
import { readText, realPath } from './u.Files.io.ts';
import { toPathCapability } from './u.Files.path.ts';
import { stat } from './u.Files.stat.ts';
import { walk } from './u.Files.walk.ts';

/**
 * Adapt `@sys/fs` into the readonly capability expected by `@sys/model/files/fs`.
 */
export const toReadonly: t.FsCapability.Files.Lib['toReadonly'] = (fs) => {
  return {
    Path: toPathCapability(fs),
    realPath: (path) => realPath(fs, path),
    stat: (path) => stat(fs, path),
    readText: (path) => readText(fs, path),
    walk: (path) => walk(fs, path),
  };
};
