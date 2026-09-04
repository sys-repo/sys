import type { t } from '../common.ts';
import { snapshotFile } from '../u/u.snapshot.file.ts';
import { Is } from './m.Snapshot.Is.ts';

const file: t.Fs.Snapshot.File.Method = (options) => snapshotFile(options);

/** Bounded stable file snapshots. */
export const Snapshot: t.Fs.Snapshot.Lib = Object.freeze({ Is, file });
