/**
 * Tools for creating directory backup snapshots of a directory.
 * @module
 */
import type { FsDirSnapshotLib } from './t.ts';

import { Fmt } from './m.Fmt.ts';
import { write } from './u.write.ts';

export const DirSnapshot: FsDirSnapshotLib = {
  Fmt,
  write,
};
