import type { t } from './common.ts';
import { isFailure } from './u/u.failure.ts';

/** ZIP predicate library. */
export const Is: t.Zip.Is.Lib = Object.freeze({ failure: isFailure });
