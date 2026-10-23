import type { t } from '../common.ts';
import { Pkg as Base } from '@sys/std/pkg';
import { Dist } from '../m.Pkg.Dist/mod.ts';

/**
 * Filesystem tools for package metadata and distribution integrity.
 */
export const Pkg: t.Pkg.Lib = Object.freeze({
  ...Base,
  Dist,
});
