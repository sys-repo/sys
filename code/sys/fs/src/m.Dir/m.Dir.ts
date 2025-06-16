import type { FsDirLib } from './t.ts';

import { DirHash as Hash } from '../m.Dir.Hash/mod.ts';
import { DirSnapshot as Snapshot } from '../m.Dir.Snapshot/mod.ts';

/**
 * Helpers for working with file-system directories.
 */
export const Dir: FsDirLib = {
  /** Tools for working hashes of a file-system directory. */
  Hash,

  /** Tools for creating directory backup snapshots of a directory. */
  Snapshot,

  /** Create a snapshot of the specified directory. */
  snapshot: Snapshot.write,
};
