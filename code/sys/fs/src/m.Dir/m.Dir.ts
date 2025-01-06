import type { t } from './common.ts';
import { snapshot } from './m.Dir.snapshot.ts';
import { DirHash as Hash } from '../m.Dir.Hash/mod.ts';

/**
 * Helpers for working with file-system directories.
 */
export const Dir: t.FsDirLib = {
  /** Tools for working hashes of a file-system directory. */
  Hash,

  /** Create a snapshot of the specified directory. */
  snapshot,
};
