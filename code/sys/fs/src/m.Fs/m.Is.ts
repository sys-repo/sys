import { type t, isBinary, isDir, isFile, StdPath } from './common.ts';

/**
 * Filesystem/Path type verification flags.
 */
export const Is: t.FsIsLib = {
  ...StdPath.Is,
  dir: isDir,
  file: isFile,
  binary: isBinary,
} as const;
