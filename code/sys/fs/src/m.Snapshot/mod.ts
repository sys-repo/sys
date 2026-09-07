/**
 * @module
 * Bounded stable single-file snapshots with explicit observation evidence.
 */
import type { t } from './common.ts';
import { Is } from './m.Is.ts';
import { snapshotFile as file } from './u/u.file.ts';

/**
 * Bounded stable file snapshots.
 */
export const Snapshot: t.Snapshot.Lib = Object.freeze({
  Is,
  file,
});
