import { type t } from '../common.ts';
import { Compat } from './m.Compat.ts';
import { Part } from './m.Dist.Part.ts';
import { Pins } from './m.Dist.Pins.ts';

export const Dist: t.Pkg.Dist.Lib = Object.freeze<t.Pkg.Dist.Lib>({
  Part,
  Pins,
  Compat,
  Is: Object.freeze({
    codePath(path) {
      if (typeof path !== 'string') return false;
      return path.startsWith('pkg/') || path.includes('/pkg/');
    },
  }),
});
