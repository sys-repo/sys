import type { t } from './common.ts';
import { admitPinnedManifest } from './u.verify/u.admitManifest.ts';
import { readPinnedPart } from './u.verify/u.pinned.part.ts';
import { verifyPinned } from './u.verify/u.pinned.ts';

/**
 * Distribution checks against caller-supplied checksums.
 */
export const Pinned: t.Pkg.Dist.Pinned.Lib = Object.freeze({
  admitManifest: admitPinnedManifest,
  verify: verifyPinned,
  readPart: readPinnedPart,
});
