import type { t } from './common.ts';
import { readPinnedPart } from './u.verify/u.pinned.part.ts';
import { verifyPinned } from './u.verify/u.pinned.ts';

/**
 * Check against an external manifest checksum and read checksum-matched files.
 */
export const Pinned: t.Pkg.Dist.Pinned.Lib = Object.freeze({
  verify: verifyPinned,
  readPart: readPinnedPart,
});
