import type { FsDirLib } from './t.ts';

import { DirHash as Hash } from '../m.Dir.Hash/mod.ts';

/**
 * Helpers for working with file-system directories.
 */
export const Dir: FsDirLib = {
  /** Tools for working hashes of a file-system directory. */
  Hash,
};
