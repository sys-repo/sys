import type { t } from './common.ts';
import type { PkgLib } from '@sys/std/t';

/**
 * PkgLib (server extenions)
 *
 * Tools for working with the standard system
 * `{pkg}` package meta-data structure.
 */
export type PkgSLib = PkgLib & {
  readonly Dist: t.PkgDistLib;
};

/**
 * Tools for working with "distribution"
 */
export type PkgDistLib = {
  /**
   * Prepare and save a "distribution package"
   * meta-data file, `pkg.json`.
   */
  compute(args: t.PkgDistComputeArgs): Promise<t.PkgSaveDistResponse>;

  /**
   * Load a `dist.json` file into a \<DistPackage\> type.
   */
  load(targetDir: t.StringPath): Promise<t.PkgLoadDistResponse>;

  /**
   * Validate a folder with hash definitions of the distribution-package.
   */
  validate(targetDir: t.StringPath): Promise<t.DistPkgValidationResponse>;
};

export type PkgDistComputeArgs = {
  dir: t.StringPath;
  pkg?: t.Pkg;
  entry?: string;
  save?: boolean;
};

/**
 * Response to a `Pkg.Dist.saveDist` method call.
 */
export type PkgSaveDistResponse = {
  exists: boolean;
  dir: t.StringDir;
  dist: t.DistPkg;
  error?: t.StdError;
};

/**
 * Response to a `Pkg.Dist.load` method call.
 */
export type PkgLoadDistResponse = {
  exists: boolean;
  path: t.StringPath;
  dist?: t.DistPkg;
  error?: t.StdError;
};

/**
 * Response to a `Pkg.Dist.validate` method call.
 */
export type DistPkgValidationResponse = {
  is: { valid?: boolean; unknown: boolean };
  exists: boolean;
  dist?: t.DistPkg;
  error?: t.StdError;
};
