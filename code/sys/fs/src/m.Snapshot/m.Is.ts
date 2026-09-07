import type { t } from './common.ts';
import { isFailure } from './u/u.failure.ts';

/** Owner-authenticated filesystem snapshot predicates. */
export const Is: t.Snapshot.Is.Lib = Object.freeze({
  failure: isFailure,
});
