import type { t } from '../common.ts';
import { isFailure } from '../u/u.snapshot.failure.ts';

/** Owner-authenticated filesystem snapshot predicates. */
export const Is: t.Fs.Snapshot.Is.Lib = Object.freeze({
  failure: isFailure,
});
