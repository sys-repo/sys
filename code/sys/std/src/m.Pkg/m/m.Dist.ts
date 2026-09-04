import { type t } from '../common.ts';
import { Part } from './m.Dist.Part.ts';
import { PkgIs } from './m.Is.ts';

export const Dist: t.Pkg.Dist.Lib = Object.freeze<t.Pkg.Dist.Lib>({
  Part,
  Compat: Object.freeze({
    legacy(input): input is t.DistPkgLegacy {
      return PkgIs.distCompat(input) && !PkgIs.dist(input);
    },
    toCanonical(input, options = {}) {
      if (PkgIs.dist(input)) return input;
      if (!Dist.Compat.legacy(input)) return;
      const policy = options.policy;
      if (typeof policy !== 'string' || !policy) return;
      const legacy = input;
      return { ...legacy, build: { ...legacy.build, hash: { policy } } };
    },
  }),
  Is: Object.freeze({
    codePath(path) {
      if (typeof path !== 'string') return false;
      return path.startsWith('pkg/') || path.includes('/pkg/');
    },
  }),
});
