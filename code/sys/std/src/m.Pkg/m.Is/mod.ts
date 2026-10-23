import type { t } from '../common.ts';
import { dist } from './u.dist.ts';
import { distPin } from './u.distPin.ts';
import { pkg } from './u.ts';
import { unknown } from './u.unknown.ts';

export const PkgIs: t.Pkg.Is.Lib = Object.freeze({
  pkg,
  dist,
  distPin,
  unknown,
});
