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
 * Tools for working with "distribution-package"
 * ie. an ESM output typically written to a `/dist` folder.
 */
export type PkgDistLib = {
  /**
   * Load a `dist.json` file into a \<DistPackage\> type.
   */
  load(dir: t.StringPath): Promise<t.PkgDistLoadResponse>;

  /**
   * Prepare and save a "distribution package"
   * meta-data file, `pkg.json`.
   */
  compute(args: t.PkgDistComputeArgs): Promise<t.PkgDistComputeResponse>;

  /**
   * Verify a folder with hash definitions of the distribution-package.
   */
  verify(
    dir: t.StringPath,
    hash?: t.StringHash | t.CompositeHash,
  ): Promise<t.PkgDistVerifyResponse>;
};

/**
 * Arguments passed to the `Pkg.Dist.compute` method.
 */
export type PkgDistComputeArgs = {
  dir: t.StringPath;
  pkg?: t.Pkg;
  entry?: string;
  save?: boolean;
};

/**
 * Response from the `Pkg.Dist.compute` method call.
 */
export type PkgDistComputeResponse = {
  exists: boolean;
  dir: t.StringDir;
  dist: t.DistPkg;
  error?: t.StdError;
};

/**
 * Response to a `Pkg.Dist.load` method call.
 */
export type PkgDistLoadResponse = {
  exists: boolean;
  path: t.StringPath;
  dist?: t.DistPkg;
  error?: t.StdError;
};

/**
 * Response to a `Pkg.Dist.verify` method call.
 */
export type PkgDistVerifyResponse = {
  is: t.HashVerifyResponse['is'];
  exists: boolean;
  dist?: t.DistPkg;
  error?: t.StdError;
};
