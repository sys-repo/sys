import type { t } from './common.ts';

/**
 * Boolean tests on a {pkg} structure.
 */
export type PkgIsLib = {
  /** Determines if the input is a string of the default "unknown" */
  unknown(input?: string | t.Pkg): boolean;

  /** Determine if the given input is a `Pkg` */
  pkg(input: unknown): input is t.Pkg;

  /** Determine if the given input is a `DistPkg` */
  dist(input: unknown): input is t.DistPkg;

  /** Determine if the given input is a canonical or legacy `DistPkg` shape. */
  distCompat(input: unknown): input is t.DistPkg | t.DistPkgLegacy;
};
