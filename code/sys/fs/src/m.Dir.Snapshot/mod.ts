/**
 * @module
 * Tools for creating directory backup snapshots of a directory.
 */
import { type t } from './common.ts';
import { write } from './u.write.ts';

export const DirSnapshot: t.FsDirSnapshotLib = {
  write,
};
