import type { t } from './common.ts';
import { readLocalPart } from './u.verify/u.pinned.part.ts';
import { verifyLocal } from './u.verify/u.pinned.ts';

/**
 * Check a local distribution and read checksum-matched files.
 */
export const Local: t.Pkg.Dist.Local.Lib = Object.freeze({
  verify: verifyLocal,
  readPart: readLocalPart,
});
