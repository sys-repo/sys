import { Pkg as Base } from '@sys/std/pkg';
import { Dist } from './m.Dist.ts';

import type { t } from './common.ts';

/**
 * PkgLib (server extenions)
 *
 * Tools for working with the standard system
 * `{pkg}` package meta-data structure.
 */
export const Pkg: t.PkgFsLib = {
  ...Base,
  Dist,
};
