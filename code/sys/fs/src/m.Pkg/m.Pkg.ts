import type { PkgFsLib } from './t.ts';

import { Pkg as Base } from '@sys/std/pkg';
import { Dist } from './m.Pkg.Dist.ts';

/**
 * PkgLib (server extenions).
 *
 * Tools for working with the standard system
 * `{pkg}` package meta-data structure.
 */
export const Pkg: PkgFsLib = {
  ...Base,
  Dist,
};
