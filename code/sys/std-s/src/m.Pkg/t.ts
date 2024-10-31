import type { t } from './common.ts';
import type { PkgLib } from '@sys/std/t';

/**
 * PkgLib (server extenions)
 *
 * Tools for working with the standard system
 * `{pkg}` package meta-data structure.
 */
export type PkgSLib = PkgLib & {
  readonly Dist: t.PkgDistSLib;
};

/**
 * Tools for working with "distribution-package"
 * ie. an ESM output typically written to a `/dist` folder.
 */
export type PkgDistSLib = {
  /**
   * Load a `dist.json` file into a \<DistPackage\> type.
   */
  load(sourceDir: t.StringPath): Promise<t.PkgDistSLoadResponse>;

  /**
   * Prepare and save a "distribution package"
   * meta-data file, `pkg.json`.
   */
  compute(args: t.PkgDistSComputeArgs): Promise<t.PkgDistSComputeResponse>;

  /**
   * Validate a folder with hash definitions of the distribution-package.
   */
  validate(sourceDir: t.StringPath): Promise<t.PkgDistSValidationResponse>;
};

/**
 * Arguments passed to the `Pkg.Dist.compute` method.
 */
export type PkgDistSComputeArgs = {
  dir: t.StringPath;
  pkg?: t.Pkg;
  entry?: string;
  save?: boolean;
};

/**
 * Response from the `Pkg.Dist.compute` method call.
 */
export type PkgDistSComputeResponse = {
  exists: boolean;
  dir: t.StringDir;
  dist: t.DistPkg;
  error?: t.StdError;
};

/**
 * Response to a `Pkg.Dist.load` method call.
 */
export type PkgDistSLoadResponse = {
  exists: boolean;
  path: t.StringPath;
  dist?: t.DistPkg;
  error?: t.StdError;
};

/**
 * Response to a `Pkg.Dist.validate` method call.
 */
export type PkgDistSValidationResponse = {
  is: { valid?: boolean; unknown: boolean };
  exists: boolean;
  dist?: t.DistPkg;
  error?: t.StdError;
};
