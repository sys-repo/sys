import { isBinary, isDir, isFile, StdPath } from './common.ts';
import type { t } from './common.ts';

/**
 * Filesystem/Path type verification flags.
 */
export const Is: t.Fs.IsLib = {
  ...StdPath.Is,
  dir: isDir,
  file: isFile,
  binary: isBinary,
} as const;
