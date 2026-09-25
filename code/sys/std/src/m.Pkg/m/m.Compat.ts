import { Is, type t } from '../common.ts';
import { PkgIs } from './m.Is.ts';

/**
 * Compatibility helpers for legacy distribution manifests.
 */
export const Compat: t.Pkg.Dist.Compat.Lib = Object.freeze({
  legacy(input): input is t.DistPkgLegacy {
    return PkgIs.distCompat(input) && !PkgIs.dist(input);
  },
  toCanonical(input, options = {}) {
    if (PkgIs.dist(input)) return input;
    if (!Compat.legacy(input)) return;
    const policy = options.policy;
    if (!Is.str(policy) || !policy) return;
    const legacy = input;
    return { ...legacy, build: { ...legacy.build, hash: { policy } } };
  },
});
