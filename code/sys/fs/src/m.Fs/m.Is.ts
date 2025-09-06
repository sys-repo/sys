import { isBinary, isDir, isFile, StdPath } from './common.ts';
import type { FsIsLib } from './t.ts';

/**
 * Filesystem/Path type verification flags.
 */
export const Is: FsIsLib = {
  ...StdPath.Is,
  dir: isDir,
  file: isFile,
  binary: isBinary,
} as const;
