import type { t } from './common.ts';

/**
 * Helpers for working with file-system directories.
 */
export type FsDirLib = {
  /** Tools for working hashes of a file-system directory. */
  readonly Hash: t.DirHashLib;
};
