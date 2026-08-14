import type { t } from '../common.ts';
import { Pkg as Base } from '@sys/std/pkg';
import { Dist } from '../m.Pkg.Dist/mod.ts';

/**
 * Pkg.Lib (server extensions).
 *
 * Tools for working with the standard system
 * `{pkg}` package meta-data structure.
 */
export const Pkg: t.Pkg.Lib = Object.freeze({
  ...Base,
  Dist,
});
