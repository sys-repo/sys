/**
 * @module
 * Tools for creating directory backup snapshots of a directory.
 */
import type { t } from './common.ts';
import { Fmt } from './m.Fmt.ts';
import { write } from './u.write.ts';

export const DirSnapshot: t.FsDirSnapshotLib = {
  Fmt,
  write,
};
