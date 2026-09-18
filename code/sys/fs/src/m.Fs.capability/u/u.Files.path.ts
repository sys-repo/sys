import { type t } from '../common.ts';

/** Adapt the `@sys/fs` Path namespace to the readonly Files path capability. */
export const toPathCapability = (fs: t.Fs.Lib): t.FsCapability.Files.Path => ({
  Is: { absolute: fs.Path.Is.absolute },
  join: fs.Path.join,
  resolve: fs.resolve,
  relative: fs.Path.relative,
  normalize: fs.Path.normalize,
});
