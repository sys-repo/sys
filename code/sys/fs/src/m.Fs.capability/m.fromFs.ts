import { type t } from './common.ts';

/**
 * Adapt the full `@sys/fs` API to the portable filesystem capability subset.
 */
export const fromFs: t.FsCapability.Lib['fromFs'] = (fs) => {
  return {
    read: fs.read,
    exists: fs.exists,
    copy: fs.copy,
    write: fs.write,
    ensureDir: fs.ensureDir,
    stat: fs.stat,
    dirname: fs.dirname,
    join: fs.join,
    cwd: fs.cwd,
    resolve: fs.resolve,
    walk: fs.walk,
    remove: fs.remove,
  };
};
