/**
 * @module
 * Tools for creating directory backup snapshots of a directory.
 */
import type { FsDirSnapshotLib } from './t.ts';

import { Fmt } from './m.Fmt.ts';
import { write } from './u.write.ts';

export const DirSnapshot: FsDirSnapshotLib = {
  Fmt,
  write,
};
