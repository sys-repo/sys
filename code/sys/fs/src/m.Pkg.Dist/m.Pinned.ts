import { type t } from './common.ts';
import { readPinnedPart } from './u.verify/u.pinned.part.ts';
import { verifyPinned } from './u.verify/u.pinned.ts';

/** Checksum-pinned distribution operations. */
export const Pinned: t.Pkg.Dist.Pinned.Lib = Object.freeze({
  verify: verifyPinned,
  readPart: readPinnedPart,
});
