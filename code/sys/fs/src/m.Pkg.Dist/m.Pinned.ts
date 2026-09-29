import type { t } from './common.ts';
import { admitPinnedManifest } from './u.verify/u.admitManifest.ts';
import { readPinnedPart } from './u.verify/u.part.ts';
import { verifyPinned } from './u.verify/u.verify.ts';

/**
 * Manifest admission and tree verification against a caller-supplied content pin.
 * `readPart` instead checks one file's checksum and size; it does not prove inventory membership.
 */
export const Pinned: t.Pkg.Dist.Pinned.Lib = Object.freeze({
  admitManifest: admitPinnedManifest,
  verify: verifyPinned,
  readPart: readPinnedPart,
});
